import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const chromiumPath = process.env.CHROMIUM_PATH || ""
if (!chromiumPath || !fs.existsSync(chromiumPath)) throw new Error("CHROMIUM_PATH must point to the Playwright Chromium executable.")

const workspace = fs.readFileSync(path.join(root, "components/kleio/creative-passport-workspace.tsx"), "utf8")
const styleMatch = workspace.match(/<style>\{`([\s\S]*?)`\}<\/style>/)
if (!styleMatch?.[1]) throw new Error("Unable to locate the Creative Passport single-scroll CSS contract.")
const passportCss = styleMatch[1]

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForJson(url, timeoutMs = 20_000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) return await response.json()
    } catch {}
    await delay(100)
  }
  throw new Error(`Timed out waiting for ${url}`)
}

class CdpClient {
  constructor(url) {
    this.socket = new WebSocket(url)
    this.sequence = 0
    this.pending = new Map()
  }

  async connect() {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timed out connecting to Chromium DevTools.")), 10_000)
      this.socket.addEventListener("open", () => { clearTimeout(timer); resolve() }, { once: true })
      this.socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Chromium DevTools connection failed.")) }, { once: true })
    })
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data))
      if (!message.id || !this.pending.has(message.id)) return
      const { resolve, reject } = this.pending.get(message.id)
      this.pending.delete(message.id)
      if (message.error) reject(new Error(message.error.message || "CDP command failed"))
      else resolve(message.result)
    })
  }

  send(method, params = {}) {
    const id = ++this.sequence
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  close() {
    this.socket.close()
  }
}

const port = 9223
const browser = spawn(chromiumPath, [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--disable-background-networking",
  "--disable-extensions",
  "--no-first-run",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${path.join("/tmp", `kleio-passport-scroll-${process.pid}`)}`,
  "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] })

let browserError = ""
browser.stderr.on("data", (chunk) => { browserError = `${browserError}${String(chunk)}`.slice(-6_000) })

try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`)
  const pageResponse = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })
  if (!pageResponse.ok) throw new Error(`Unable to create a Chromium page: ${pageResponse.status}`)
  const pageInfo = await pageResponse.json()
  const client = new CdpClient(pageInfo.webSocketDebuggerUrl)
  await client.connect()
  await client.send("Page.enable")
  await client.send("Runtime.enable")

  const html = `<!doctype html>
  <html><head><meta charset="utf-8"><style>
    html, body { margin: 0; height: 100%; }
    ${passportCss}
  </style></head><body>
    <main data-passport-scroll-owner="creative-passport" style="height:600px;overflow-y:auto;background:white">
      <div data-passport-edit-header style="height:64px;border-bottom:1px solid #ddd">Creative Passport context row</div>
      <div data-passport-edit-content>
        <div style="display:flex;height:600px;min-height:0;flex-direction:column">
          <section aria-label="Creative Passport workflow" style="height:52px;flex-shrink:0">Workflow controls</section>
          <div style="min-height:0;flex:1">
            <main style="height:100%;overflow-y:auto">
              <div style="height:1800px;padding-top:20px">Passport fields</div>
            </main>
          </div>
        </div>
      </div>
    </main>
  </body></html>`

  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
  await client.send("Page.navigate", { url: dataUrl })
  await delay(400)

  const expression = `new Promise((resolve) => {
    const owner = document.querySelector('[data-passport-scroll-owner="creative-passport"]')
    const header = document.querySelector('[data-passport-edit-header]')
    const nestedMain = document.querySelector('[data-passport-edit-content] main')
    const beforeTop = header.getBoundingClientRect().top
    const nestedBefore = {
      overflowY: getComputedStyle(nestedMain).overflowY,
      height: getComputedStyle(nestedMain).height,
      clientHeight: nestedMain.clientHeight,
      scrollHeight: nestedMain.scrollHeight,
    }
    owner.scrollTop = 360
    requestAnimationFrame(() => requestAnimationFrame(() => {
      resolve({
        ownerScrollTop: owner.scrollTop,
        ownerClientHeight: owner.clientHeight,
        ownerScrollHeight: owner.scrollHeight,
        headerBeforeTop: beforeTop,
        headerAfterTop: header.getBoundingClientRect().top,
        headerDelta: header.getBoundingClientRect().top - beforeTop,
        nested: nestedBefore,
      })
    }))
  })`
  const response = await client.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })
  const result = response.result?.value || {}
  client.close()

  const failures = []
  if (result.ownerScrollHeight <= result.ownerClientHeight) failures.push("The page-level Passport owner is not scrollable.")
  if (result.ownerScrollTop < 300) failures.push(`The page-level Passport owner did not accept the requested scroll; scrollTop=${result.ownerScrollTop}.`)
  if (result.headerDelta > -300) failures.push(`The Passport context row did not move with the fields; delta=${result.headerDelta}.`)
  if (![/visible/i, /clip/i].some((pattern) => pattern.test(String(result.nested?.overflowY || "")))) failures.push(`The nested Passport form still owns vertical scrolling; overflow-y=${result.nested?.overflowY}.`)
  if (Number(result.nested?.clientHeight || 0) < 1700) failures.push(`The nested Passport form retained a fixed viewport height; clientHeight=${result.nested?.clientHeight}.`)

  if (failures.length) {
    console.error("KLEIO Creative Passport Chromium scroll proof failed:\n")
    for (const failure of failures) console.error(`- ${failure}`)
    console.error(JSON.stringify(result, null, 2))
    process.exit(1)
  }

  console.log("KLEIO Creative Passport Chromium scroll proof passed.")
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  if (browserError) console.error(browserError)
  process.exitCode = 1
} finally {
  browser.kill("SIGTERM")
}
