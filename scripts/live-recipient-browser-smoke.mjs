import { spawn } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

const SITE_URL = (process.env.SITE_URL || "https://www.kleioarthouse.com").replace(/\/$/, "")
const CHROME_BIN = process.env.CHROME_BIN
const port = Number(process.env.CHROME_DEBUG_PORT || 9222)
const artifactDir = path.resolve(process.env.RECIPIENT_SMOKE_ARTIFACT_DIR || "qa-artifacts/recipient-live")

if (!CHROME_BIN) throw new Error("CHROME_BIN is required.")
if (typeof WebSocket === "undefined") throw new Error("Node WebSocket support is required.")

mkdirSync(artifactDir, { recursive: true })
const profileDir = mkdtempSync(path.join(tmpdir(), "kleio-recipient-smoke-"))
const chrome = spawn(CHROME_BIN, [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--disable-background-networking",
  "--remote-debugging-address=127.0.0.1",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] })

chrome.stderr.on("data", () => {})
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitForDebugger() {
  const deadline = Date.now() + 15000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`)
      if (response.ok) {
        const targets = await response.json()
        const page = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl)
        if (page) return page
      }
    } catch {}
    await sleep(200)
  }
  throw new Error("Chrome DevTools endpoint did not become available.")
}

class CdpClient {
  constructor(url) {
    this.ws = new WebSocket(url)
    this.id = 0
    this.pending = new Map()
    this.events = []
  }
  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true })
      this.ws.addEventListener("error", reject, { once: true })
    })
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data))
      if (message.id && this.pending.has(message.id)) {
        const pending = this.pending.get(message.id)
        this.pending.delete(message.id)
        if (message.error) pending.reject(new Error(message.error.message))
        else pending.resolve(message.result)
      } else if (message.method) {
        this.events.push(message)
      }
    })
  }
  send(method, params = {}) {
    const id = ++this.id
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }
  close() { this.ws.close() }
}

async function evaluate(client, expression) {
  const response = await client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true })
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || "Browser evaluation failed.")
  return response.result?.value
}

async function navigate(client, url) {
  client.events.length = 0
  await client.send("Page.navigate", { url })
  const deadline = Date.now() + 15000
  while (Date.now() < deadline) {
    if (await evaluate(client, "document.readyState === 'complete'")) return
    await sleep(150)
  }
  throw new Error(`Page did not finish loading: ${url}`)
}

async function waitForText(client, text, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs
  const literal = JSON.stringify(text)
  while (Date.now() < deadline) {
    if (await evaluate(client, `Boolean(document.body && document.body.innerText.includes(${literal}))`)) return
    await sleep(250)
  }
  const visible = await evaluate(client, "document.body ? document.body.innerText.slice(0, 3000) : ''")
  throw new Error(`Timed out waiting for rendered text: ${text}\nVisible text:\n${visible}`)
}

async function clickButton(client, label) {
  const literal = JSON.stringify(label)
  const clicked = await evaluate(client, `(() => { const button = [...document.querySelectorAll('button')].find((node) => (node.textContent || '').includes(${literal})); if (!button) return false; button.click(); return true })()`)
  if (!clicked) throw new Error(`Could not find button containing: ${label}`)
}

async function setTextarea(client, value) {
  const literal = JSON.stringify(value)
  const changed = await evaluate(client, `(() => { const el = document.querySelector('textarea'); if (!el) return false; const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; setter.call(el, ${literal}); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true })()`)
  if (!changed) throw new Error("Could not find the message textarea.")
}

async function screenshot(client, name) {
  const { data } = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false })
  writeFileSync(path.join(artifactDir, name), Buffer.from(data, "base64"))
}

function actionableFailures(events) {
  const failures = []
  for (const event of events) {
    if (event.method === "Runtime.exceptionThrown") failures.push(`runtime exception: ${event.params?.exceptionDetails?.text || "unknown"}`)
    if (event.method === "Log.entryAdded" && event.params?.entry?.level === "error") failures.push(`console error: ${event.params.entry.text}`)
    if (event.method === "Network.loadingFailed" && !event.params?.canceled && !/ERR_ABORTED/.test(event.params?.errorText || "")) failures.push(`network error: ${event.params?.errorText || "unknown"}`)
  }
  return failures
}

async function assertNoFailures(client, label) {
  const failures = actionableFailures(client.events)
  if (failures.length) throw new Error(`${label} produced browser failures:\n${failures.slice(0, 12).join("\n")}`)
}

async function cleanupChrome() {
  try {
    if (chrome.exitCode === null) {
      chrome.kill("SIGTERM")
      await Promise.race([
        new Promise((resolve) => chrome.once("exit", resolve)),
        sleep(1500),
      ])
    }
  } catch {
    // Cleanup must never overwrite the actual live-browser assertion result.
  }

  try {
    rmSync(profileDir, { recursive: true, force: true, maxRetries: 8, retryDelay: 125 })
  } catch (reason) {
    console.warn(`Chrome profile cleanup skipped: ${reason instanceof Error ? reason.message : String(reason)}`)
  }
}

async function run() {
  const target = await waitForDebugger()
  const client = new CdpClient(target.webSocketDebuggerUrl)
  await client.open()
  await Promise.all([client.send("Page.enable"), client.send("Runtime.enable"), client.send("Log.enable"), client.send("Network.enable")])

  const invalidToken = "0".repeat(64)
  await navigate(client, `${SITE_URL}/application-review/?token=${invalidToken}&cdp_smoke=${Date.now()}`)
  await waitForText(client, "This application link is invalid or no longer available.", 20000)
  await screenshot(client, "invalid-token.png")
  await assertNoFailures(client, "Secure Review Room invalid-token state")
  console.log("PASS secure Review Room hydrates and fails closed for an unknown token.")

  await navigate(client, `${SITE_URL}/application-review/conversation/?cdp_smoke=${Date.now()}`)
  await waitForText(client, "This conversation link is incomplete.", 10000)
  await screenshot(client, "conversation-incomplete.png")
  await assertNoFailures(client, "Conversation return missing-reference state")
  console.log("PASS conversation return hydrates and fails closed when its reference is missing.")

  await client.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await navigate(client, `${SITE_URL}/application-review/demo/?cdp_smoke=${Date.now()}`)
  await waitForText(client, "Synthetic preview", 10000)
  await waitForText(client, "Write first. Verification appears only when you choose to send.", 10000)
  await clickButton(client, "Message applicant")
  await waitForText(client, "Message Ana Martínez", 5000)
  await setTextarea(client, "Could you clarify the installation requirements for the proposed work?")
  await clickButton(client, "Continue to send")
  await waitForText(client, "One lightweight verification.", 5000)
  await clickButton(client, "Simulate verified send")
  await waitForText(client, "Conversation with Ana Martínez", 5000)
  await waitForText(client, "Create Review Workspace", 5000)
  await screenshot(client, "demo-conversation-desktop.png")
  await assertNoFailures(client, "Synthetic Review Room interaction")
  console.log("PASS synthetic Review Room completes compose → identity → conversation → workspace invitation.")

  await client.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await navigate(client, `${SITE_URL}/application-review/demo/?mobile_smoke=${Date.now()}`)
  await waitForText(client, "Between Salt and Memory", 10000)
  const overflow = await evaluate(client, "Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth")
  if (Number(overflow) > 3) throw new Error(`Mobile Review Room has ${overflow}px of page-level horizontal overflow.`)
  await screenshot(client, "demo-mobile.png")
  await assertNoFailures(client, "Synthetic Review Room mobile state")
  console.log("PASS synthetic Review Room renders at 390px without page-level horizontal overflow.")

  client.close()
}

try {
  await run()
} finally {
  await cleanupChrome()
}
