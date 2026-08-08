import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const outDir = path.join(root, "out")
const baseUrl = process.env.KLEIO_AUDIT_BASE_URL || "http://127.0.0.1:4173"
const chromiumPath = process.env.CHROMIUM_PATH || ""
const reportDir = path.join(root, "docs")
const reportJson = path.join(reportDir, "rendered-visual-convenience-audit.json")
const reportMarkdown = path.join(reportDir, "rendered-visual-convenience-audit.md")

if (!fs.existsSync(outDir)) throw new Error("Build output is missing. Run pnpm build before the rendered visual audit.")
if (!chromiumPath || !fs.existsSync(chromiumPath)) throw new Error("CHROMIUM_PATH must point to the Playwright Chromium executable.")

function collectRoutes(directory) {
  const routes = []
  const queue = [directory]
  while (queue.length) {
    const current = queue.pop()
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name)
      if (entry.isDirectory()) queue.push(target)
      else if (entry.name === "index.html") {
        const relative = path.relative(directory, target).replaceAll(path.sep, "/")
        const route = relative === "index.html" ? "/" : `/${relative.replace(/\/index\.html$/, "")}`
        routes.push(route)
      }
    }
  }
  return [...new Set(routes)].sort()
}

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
    await delay(150)
  }
  throw new Error(`Timed out waiting for ${url}`)
}

class CdpClient {
  constructor(url) {
    this.url = url
    this.socket = null
    this.sequence = 0
    this.pending = new Map()
    this.listeners = new Map()
  }

  async connect() {
    this.socket = new WebSocket(this.url)
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timed out connecting to Chromium DevTools.")), 10_000)
      this.socket.addEventListener("open", () => { clearTimeout(timer); resolve() }, { once: true })
      this.socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Chromium DevTools connection failed.")) }, { once: true })
    })
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data))
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id)
        this.pending.delete(message.id)
        if (message.error) reject(new Error(message.error.message || "CDP command failed"))
        else resolve(message.result)
        return
      }
      if (message.method && this.listeners.has(message.method)) {
        const callbacks = this.listeners.get(message.method)
        this.listeners.delete(message.method)
        for (const callback of callbacks) callback(message.params)
      }
    })
  }

  send(method, params = {}) {
    const id = ++this.sequence
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  once(method, timeoutMs = 15_000) {
    return new Promise((resolve, reject) => {
      const callbacks = this.listeners.get(method) || []
      callbacks.push(resolve)
      this.listeners.set(method, callbacks)
      setTimeout(() => {
        const remaining = (this.listeners.get(method) || []).filter((callback) => callback !== resolve)
        if (remaining.length) this.listeners.set(method, remaining)
        else this.listeners.delete(method)
        reject(new Error(`Timed out waiting for ${method}`))
      }, timeoutMs)
    })
  }

  close() {
    this.socket?.close()
  }
}

const browser = spawn(chromiumPath, [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--disable-background-networking",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-extensions",
  "--disable-sync",
  "--metrics-recording-only",
  "--mute-audio",
  "--no-first-run",
  "--remote-debugging-address=127.0.0.1",
  "--remote-debugging-port=9222",
  `--user-data-dir=${path.join("/tmp", `kleio-visual-audit-${process.pid}`)}`,
  "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] })

let browserError = ""
browser.stderr.on("data", (chunk) => { browserError = `${browserError}${String(chunk)}`.slice(-8_000) })

const routes = collectRoutes(outDir)
const viewports = [
  { name: "desktop", width: 1440, height: 900, mobile: false },
  { name: "mobile", width: 390, height: 844, mobile: true },
]
const results = []

const browserInfo = await waitForJson("http://127.0.0.1:9222/json/version")
const pageResponse = await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" })
if (!pageResponse.ok) throw new Error(`Unable to create a Chromium page: ${pageResponse.status}`)
const pageInfo = await pageResponse.json()
const client = new CdpClient(pageInfo.webSocketDebuggerUrl)
await client.connect()
await client.send("Page.enable")
await client.send("Runtime.enable")
await client.send("Network.enable")

const evaluateExpression = `(() => {
  const viewport = { width: window.innerWidth, height: window.innerHeight }
  const visible = (element, style, rect) => style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) > 0.02 && rect.width > 1 && rect.height > 1
  const descriptor = (element, style, rect) => ({
    tag: element.tagName.toLowerCase(),
    role: element.getAttribute("role") || "",
    id: element.id || "",
    classes: String(element.className || "").slice(0, 260),
    text: String(element.getAttribute("aria-label") || element.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 180),
    position: style.position,
    pointerEvents: style.pointerEvents,
    auditSafe: element.hasAttribute("data-audit-sticky-safe"),
    rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
    areaRatio: Number(((rect.width * rect.height) / (viewport.width * viewport.height)).toFixed(4)),
    widthRatio: Number((rect.width / viewport.width).toFixed(4)),
    heightRatio: Number((rect.height / viewport.height).toFixed(4)),
  })
  const positioned = [...document.querySelectorAll("body *")].map((element) => {
    const style = getComputedStyle(element)
    if (style.position !== "fixed" && style.position !== "sticky") return null
    const rect = element.getBoundingClientRect()
    return visible(element, style, rect) ? descriptor(element, style, rect) : null
  }).filter(Boolean)
  const main = document.querySelector("main")
  const mainRect = main?.getBoundingClientRect() || null
  const interactive = [...document.querySelectorAll("button, a, input, select, textarea, [role='button'], [role='dialog'], [role='alertdialog']")]
    .map((element) => {
      const style = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      return visible(element, style, rect) ? descriptor(element, style, rect) : null
    }).filter(Boolean)
  return {
    title: document.title,
    pathname: location.pathname,
    readyState: document.readyState,
    viewport,
    documentWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
    documentHeight: Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0),
    horizontalOverflow: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0) - viewport.width,
    positioned,
    mainRect: mainRect ? { x: Math.round(mainRect.x), y: Math.round(mainRect.y), width: Math.round(mainRect.width), height: Math.round(mainRect.height) } : null,
    interactiveCount: interactive.length,
    bodyText: String(document.body?.innerText || "").replace(/\\s+/g, " ").trim().slice(0, 260),
  }
})()`

for (const viewport of viewports) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
  })

  for (const route of routes) {
    const target = `${baseUrl}${route === "/" ? "/" : `${route}/`}`
    const load = client.once("Page.loadEventFired", 20_000).catch(() => null)
    await client.send("Page.navigate", { url: target })
    await load
    await delay(850)
    const response = await client.send("Runtime.evaluate", { expression: evaluateExpression, returnByValue: true, awaitPromise: true })
    const snapshot = response.result?.value || {}
    const issues = []

    if (Number(snapshot.horizontalOverflow || 0) > 4) {
      issues.push({ severity: "high", code: "horizontal_overflow", detail: `${Math.round(snapshot.horizontalOverflow)}px beyond the viewport` })
    }

    for (const element of snapshot.positioned || []) {
      const textValue = String(element.text || "").toLowerCase()
      const classValue = String(element.classes || "").toLowerCase()
      const isModal = element.role === "dialog" || element.role === "alertdialog" || textValue.includes("close dialog") || classValue.includes("backdrop")
      const isPrimaryNavigation = element.tag === "nav" || classValue.includes("sidebar") || classValue.includes("top-navigation")
      const isSmallUtility = element.areaRatio <= 0.08 && element.heightRatio <= 0.22
      if (element.auditSafe || isModal || isPrimaryNavigation || isSmallUtility) continue

      if (element.position === "fixed" && element.areaRatio > 0.30) {
        issues.push({ severity: "high", code: "oversized_fixed_surface", detail: element })
      } else if (element.position === "fixed" && element.widthRatio > 0.28 && element.heightRatio > 0.52) {
        issues.push({ severity: "high", code: "workspace_squeezing_fixed_surface", detail: element })
      } else if (element.position === "sticky" && element.heightRatio > 0.22) {
        issues.push({ severity: "high", code: "oversized_sticky_surface", detail: element })
      } else if (viewport.mobile && element.position === "fixed" && element.heightRatio > 0.24) {
        issues.push({ severity: "high", code: "mobile_fixed_surface_too_tall", detail: element })
      } else if (element.areaRatio > 0.16) {
        issues.push({ severity: "medium", code: "large_positioned_surface", detail: element })
      }
    }

    if ((snapshot.bodyText || "").length < 20) {
      issues.push({ severity: "medium", code: "nearly_empty_render", detail: snapshot.bodyText || "No visible body text" })
    }

    results.push({ route, viewport: viewport.name, target, snapshot, issues })
    process.stdout.write(`${viewport.name.padEnd(7)} ${route} — ${issues.length ? `${issues.length} issue(s)` : "clear"}\n`)
  }
}

client.close()
browser.kill("SIGTERM")

const highIssues = results.flatMap((result) => result.issues.filter((issue) => issue.severity === "high").map((issue) => ({ route: result.route, viewport: result.viewport, ...issue })))
const mediumIssues = results.flatMap((result) => result.issues.filter((issue) => issue.severity === "medium").map((issue) => ({ route: result.route, viewport: result.viewport, ...issue })))
const report = {
  generated_at: new Date().toISOString(),
  routes_tested: routes.length,
  rendered_states_tested: results.length,
  viewports,
  high_issue_count: highIssues.length,
  medium_issue_count: mediumIssues.length,
  high_issues: highIssues,
  medium_issues: mediumIssues,
  results,
  browser_error_tail: browserError,
}

fs.mkdirSync(reportDir, { recursive: true })
fs.writeFileSync(reportJson, `${JSON.stringify(report, null, 2)}\n`)
const markdown = [
  "# KLEIO Rendered Visual Convenience Audit",
  "",
  `- Exported routes tested: ${routes.length}`,
  `- Rendered route/viewport states: ${results.length}`,
  `- High-severity obstructions: ${highIssues.length}`,
  `- Medium observations: ${mediumIssues.length}`,
  "",
  "## High-severity obstructions",
  "",
  ...(highIssues.length ? highIssues.map((issue) => `- **${issue.viewport} ${issue.route}** — ${issue.code}: \`${JSON.stringify(issue.detail).slice(0, 600)}\``) : ["None detected."]),
  "",
  "## Medium observations",
  "",
  ...(mediumIssues.length ? mediumIssues.slice(0, 100).map((issue) => `- **${issue.viewport} ${issue.route}** — ${issue.code}: \`${JSON.stringify(issue.detail).slice(0, 500)}\``) : ["None detected."]),
  "",
  "The audit intentionally excludes visible modal surfaces, primary navigation, small utility controls, and explicitly reviewed positioned surfaces marked with data-audit-sticky-safe from obstruction failures.",
]
fs.writeFileSync(reportMarkdown, `${markdown.join("\n")}\n`)

console.log(`Rendered visual audit completed: ${routes.length} routes × ${viewports.length} viewports; ${highIssues.length} high-severity and ${mediumIssues.length} medium observations.`)
if (highIssues.length) process.exit(1)
