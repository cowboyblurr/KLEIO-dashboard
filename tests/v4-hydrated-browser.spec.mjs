import { test, expect } from "@playwright/test"
import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"

const BASE_URL = process.env.V4_BROWSER_BASE_URL || "http://127.0.0.1:4173"
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://trekynurdgxgtaaqqtyq.supabase.co"
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_XdYXvd0fQm3IJKxNrFXgUQ_M4RgDj1M"
const RUN_ID = process.env.GITHUB_RUN_ID || process.env.QA_RUN_ID || "local"
const HEAD_SHA = process.env.GITHUB_SHA || "local"
const reportDir = path.join(process.cwd(), "qa-artifacts", "v4-browser")
fs.mkdirSync(reportDir, { recursive: true })

function sha(value) { return crypto.createHash("sha256").update(value).digest("hex") }
function passwordFor(label) { return `V4!Aa1-${sha(`${RUN_ID}:${HEAD_SHA}:${label}:KLEIO`).slice(0, 26)}` }
function emailFor(label) { return `kleio-v4-${label}-${RUN_ID}@example.com` }

const report = {
  generated_at: new Date().toISOString(),
  run_id: RUN_ID,
  head_sha: HEAD_SHA,
  viewports: [],
  modal_cycles: 0,
  navigation_cycles: 0,
  console_errors: [],
  page_errors: [],
  request_failures: [],
  checks: [],
  measurements: {},
}

function record(name, passed, detail = "") {
  report.checks.push({ name, passed: Boolean(passed), detail })
}
function saveReport() {
  fs.writeFileSync(path.join(reportDir, "browser-report.json"), `${JSON.stringify(report, null, 2)}\n`)
}

function nodeClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
}

async function artistNodeSession() {
  const supabase = nodeClient()
  const signed = await supabase.auth.signInWithPassword({ email: emailFor("artist"), password: passwordFor("artist") })
  if (signed.error || !signed.data.session || !signed.data.user) throw new Error(`V4 browser cannot authenticate artist test user: ${signed.error?.message || "missing session"}`)
  return { supabase, session: signed.data.session, user: signed.data.user }
}

async function createBrowserReviewToken() {
  const artist = await artistNodeSession()
  const packageResult = await artist.supabase
    .from("application_packages")
    .select("id,artist_approved_at,state,data_scope,updated_at")
    .eq("artist_user_id", artist.user.id)
    .eq("data_scope", "synthetic_test")
    .not("artist_approved_at", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (packageResult.error || !packageResult.data?.id) throw new Error(`No finalized V4 synthetic package for browser review: ${packageResult.error?.message || "missing package"}`)
  const response = await fetch(`${SUPABASE_URL}/functions/v1/recipient-application-review`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${artist.session.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create_access", package_id: packageResult.data.id }),
  })
  const data = await response.json()
  if (!response.ok || !data?.token) throw new Error(`Unable to create V4 browser recipient access: ${response.status} ${JSON.stringify(data)}`)
  return { token: data.token, packageId: packageResult.data.id, accessId: data.access_id }
}

async function attachDiagnostics(page) {
  page.on("console", (message) => {
    if (message.type() === "error") report.console_errors.push({ url: page.url(), text: message.text().slice(0, 500) })
  })
  page.on("pageerror", (error) => report.page_errors.push({ url: page.url(), text: String(error).slice(0, 500) }))
  page.on("requestfailed", (request) => report.request_failures.push({ url: request.url(), failure: request.failure()?.errorText || "failed" }))
}

async function loginThroughRenderedForm(page) {
  await page.goto(`${BASE_URL}/artist-dashboard/`, { waitUntil: "domcontentloaded" })
  const email = page.getByLabel("Email address")
  if (await email.count()) {
    await email.fill(emailFor("artist"))
    await page.getByLabel("Password").fill(passwordFor("artist"))
    await page.getByRole("button", { name: "Sign in" }).click()
  }
  await expect(page.getByText(/Artist workspace|Creative Passport|Opportunities|Workspace/i).first()).toBeVisible({ timeout: 20_000 })
  record("rendered login form establishes real artist browser session", true, page.url())
}

async function assertNoHorizontalOverflow(page, label, tolerance = 4) {
  const measure = await page.evaluate(() => ({ width: window.innerWidth, scrollWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0) }))
  const overflow = measure.scrollWidth - measure.width
  report.viewports.push({ label, width: measure.width, scrollWidth: measure.scrollWidth, overflow })
  expect(overflow, `${label} horizontal overflow`).toBeLessThanOrEqual(tolerance)
}

async function assertUsableRoute(page, route, label) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(550)
  await expect(page.locator("main")).toBeVisible()
  const text = (await page.locator("body").innerText()).trim()
  expect(text.length, `${label} should render meaningful content`).toBeGreaterThan(40)
  expect(text).not.toMatch(/404|page not found/i)
  await assertNoHorizontalOverflow(page, label)
}

async function focusInside(page, dialog) {
  return page.evaluate((element) => element.contains(document.activeElement), await dialog.elementHandle())
}

async function testMediaAssistLifecycle(page) {
  await page.goto(`${BASE_URL}/artist-dashboard/media/`, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(800)
  const assist = page.getByRole("button", { name: /(?:Open|Run|Retry) Media Assist/i }).first()
  await expect(assist).toBeVisible({ timeout: 15_000 })
  const heapBefore = await page.evaluate(() => ({
    nodes: document.querySelectorAll("*").length,
    heap: performance.memory?.usedJSHeapSize || null,
  }))
  const requestCounts = new Map()
  const onRequest = (request) => {
    const url = new URL(request.url())
    const key = `${request.method()} ${url.pathname}`
    requestCounts.set(key, (requestCounts.get(key) || 0) + 1)
  }
  page.on("request", onRequest)
  for (let cycle = 0; cycle < 25; cycle += 1) {
    await assist.click()
    const dialog = page.getByRole("dialog", { name: /Media Assist/i })
    await expect(dialog).toBeVisible()
    expect(await focusInside(page, dialog), `cycle ${cycle + 1} focus should enter Media Assist`).toBe(true)
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press(i % 3 === 0 ? "Shift+Tab" : "Tab")
      expect(await focusInside(page, dialog), `cycle ${cycle + 1} Tab must stay inside Media Assist`).toBe(true)
    }
    await page.keyboard.press("Escape")
    await expect(dialog).toHaveCount(0)
    const activeName = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent || "")
    expect(activeName).toMatch(/Media Assist/i)
    report.modal_cycles += 1
  }
  page.off("request", onRequest)
  const heapAfter = await page.evaluate(() => ({
    nodes: document.querySelectorAll("*").length,
    heap: performance.memory?.usedJSHeapSize || null,
  }))
  report.measurements.media_assist_lifecycle = { before: heapBefore, after: heapAfter, requestCounts: Object.fromEntries(requestCounts) }
  expect(heapAfter.nodes).toBeLessThanOrEqual(Math.max(heapBefore.nodes + 250, Math.ceil(heapBefore.nodes * 1.35)))
  if (heapBefore.heap && heapAfter.heap) expect(heapAfter.heap).toBeLessThanOrEqual(Math.max(heapBefore.heap * 3, heapBefore.heap + 40_000_000))
  record("Media Assist survives 25 open-close keyboard cycles", true, `nodes ${heapBefore.nodes}->${heapAfter.nodes}`)
}

async function testBackForward(page) {
  await page.goto(`${BASE_URL}/artist-dashboard/passport/`, { waitUntil: "domcontentloaded" })
  await page.goto(`${BASE_URL}/artist-dashboard/media/`, { waitUntil: "domcontentloaded" })
  await page.goBack({ waitUntil: "domcontentloaded" })
  await expect(page.locator("main")).toContainText(/Creative Passport|Passport/i)
  await page.goForward({ waitUntil: "domcontentloaded" })
  await expect(page.locator("main")).toContainText(/Media Library/i)
  for (let i = 0; i < 8; i += 1) {
    await page.goBack({ waitUntil: "domcontentloaded" })
    await page.goForward({ waitUntil: "domcontentloaded" })
    report.navigation_cycles += 2
  }
  expect(await page.getByLabel("Email address").count()).toBe(0)
  record("Back/Forward torture does not unexpectedly lose artist session", true, `history_moves=${report.navigation_cycles}`)
}

async function testStorageCorruption(page) {
  await page.goto(`${BASE_URL}/artist-dashboard/applications/`, { waitUntil: "domcontentloaded" })
  await page.evaluate(() => {
    localStorage.setItem("kleio_application_id", "not-a-uuid")
    localStorage.setItem("kleio_artist_id", "stale-other-artist")
    localStorage.setItem("kleio_application_state", "{malformed-json")
    localStorage.setItem("kleio_v0_state", JSON.stringify({ version: -99, package_id: "foreign" }))
  })
  await page.reload({ waitUntil: "domcontentloaded" })
  await expect(page.locator("main")).toBeVisible()
  expect(await page.getByLabel("Email address").count()).toBe(0)
  const leaked = await page.locator("body").innerText()
  expect(leaked).not.toContain("stale-other-artist")
  record("malformed/stale non-authoritative browser storage does not replace authenticated artist identity", true)
}

async function testViewportMatrix(page) {
  const widths = [320, 360, 375, 390, 430, 768, 1440]
  const routes = [
    ["/artist-dashboard/passport/", "passport"],
    ["/artist-dashboard/media/", "media"],
    ["/artist-dashboard/opportunities/", "opportunities"],
    ["/artist-dashboard/applications/", "applications"],
  ]
  for (const width of widths) {
    await page.setViewportSize({ width, height: width >= 1000 ? 900 : 844 })
    for (const [route, name] of routes) await assertUsableRoute(page, route, `${name}-${width}`)
  }
  await page.setViewportSize({ width: 844, height: 390 })
  await assertUsableRoute(page, "/artist-dashboard/media/", "media-landscape-844x390")
  await page.setViewportSize({ width: 390, height: 420 })
  await assertUsableRoute(page, "/artist-dashboard/applications/", "applications-software-keyboard-like-390x420")

  await page.setViewportSize({ width: 720, height: 450 })
  await page.goto(`${BASE_URL}/artist-dashboard/passport/`, { waitUntil: "domcontentloaded" })
  await page.evaluate(() => { document.documentElement.style.zoom = "2" })
  await page.waitForTimeout(250)
  const bodyText = await page.locator("body").innerText()
  expect(bodyText).toMatch(/Creative Passport|Passport/i)
  const focusedInteractive = await page.locator("button:visible, a:visible, input:visible, textarea:visible").count()
  expect(focusedInteractive).toBeGreaterThan(0)
  record("200% CSS zoom stress keeps Passport content and interactive controls present", true, `interactive=${focusedInteractive}`)
  await page.evaluate(() => { document.documentElement.style.zoom = "" })
}

async function testRecipientJourney(browser) {
  const review = await createBrowserReviewToken()
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await attachDiagnostics(page)
  await page.goto(`${BASE_URL}/application-review/?token=${encodeURIComponent(review.token)}`, { waitUntil: "domcontentloaded" })
  await expect(page.getByText("Internal synthetic test")).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText("V4 Synthetic Artist").first()).toBeVisible()
  await assertNoHorizontalOverflow(page, "recipient-390")
  for (const marker of ["MAP-01", "MAP-10", "MAP-20"]) await expect(page.getByText(new RegExp(marker))).toBeVisible()

  const artworkButton = page.getByRole("button", { name: /Open .* in focus view/i }).first()
  await expect(artworkButton).toBeVisible()
  await artworkButton.click()
  const artworkDialog = page.getByRole("dialog", { name: /focus view/i })
  await expect(artworkDialog).toBeVisible()
  expect(await focusInside(page, artworkDialog)).toBe(true)
  for (let i = 0; i < 8; i += 1) {
    await page.keyboard.press(i % 2 ? "Tab" : "Shift+Tab")
    expect(await focusInside(page, artworkDialog)).toBe(true)
  }
  await page.keyboard.press("Escape")
  await expect(artworkDialog).toHaveCount(0)
  const restored = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") || "")
  expect(restored).toMatch(/Open .* in focus view/i)
  record("recipient artwork dialog enters, traps, and restores keyboard focus", true)

  await page.getByRole("button", { name: "Message applicant" }).first().click()
  await page.getByLabel("Message").fill("V4 browser keyboard review question")
  await page.getByRole("button", { name: /Continue to send/i }).click()
  await expect(page.getByText("One lightweight verification.")).toBeVisible()
  await page.getByLabel("Name").fill("Zoë O'Neil 🎨")
  await page.getByLabel("Institution / organization").fill("Typed Museum <script>alert('v4-browser')</script>")
  await page.getByLabel("Email").fill(emailFor("recipient"))
  await expect(page.getByRole("button", { name: /Verify email and send/i })).toBeEnabled()
  record("recipient can compose first, then reach lightweight identity step without account wall", true)

  for (const width of [320, 360, 375, 390, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: width >= 1000 ? 900 : 844 })
    await assertNoHorizontalOverflow(page, `recipient-${width}`)
    await expect(page.getByRole("button", { name: /Verify email and send/i })).toBeVisible()
  }
  await page.setViewportSize({ width: 844, height: 390 })
  await assertNoHorizontalOverflow(page, "recipient-landscape-844x390")
  await page.setViewportSize({ width: 390, height: 420 })
  await assertNoHorizontalOverflow(page, "recipient-keyboard-like-390x420")

  await page.goto(`${BASE_URL}/application-review/?token=definitely-not-a-valid-v4-token`, { waitUntil: "domcontentloaded" })
  await expect(page.getByText("Application access unavailable")).toBeVisible({ timeout: 15_000 })
  const invalidText = await page.locator("body").innerText()
  expect(invalidText).not.toMatch(/FunctionsHttpError|SQL error|stack trace|application_recipient_access/i)
  record("invalid recipient token fails closed with non-technical user-facing state", true)
  await context.close()
}

test.describe.configure({ mode: "serial", timeout: 180_000 })

test("V4 authenticated artist browser, mobile, keyboard, and recipient stress", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await attachDiagnostics(page)
  try {
    await loginThroughRenderedForm(page)
    await testViewportMatrix(page)
    await testMediaAssistLifecycle(page)
    await testBackForward(page)
    await testStorageCorruption(page)
    await testRecipientJourney(browser)

    const relevantConsole = report.console_errors.filter((item) => !/favicon|ResizeObserver/i.test(item.text))
    const relevantPageErrors = report.page_errors
    const relevantRequestFailures = report.request_failures.filter((item) => !/ERR_ABORTED|favicon/i.test(item.failure) && !/favicon/i.test(item.url))
    record("hydrated browser has no unexpected console errors", relevantConsole.length === 0, `count=${relevantConsole.length}`)
    record("hydrated browser has no uncaught page errors", relevantPageErrors.length === 0, `count=${relevantPageErrors.length}`)
    record("hydrated browser has no unrelated failed network requests", relevantRequestFailures.length === 0, `count=${relevantRequestFailures.length}`)
    expect(relevantConsole, JSON.stringify(relevantConsole.slice(0, 5))).toHaveLength(0)
    expect(relevantPageErrors, JSON.stringify(relevantPageErrors.slice(0, 5))).toHaveLength(0)
    expect(relevantRequestFailures, JSON.stringify(relevantRequestFailures.slice(0, 5))).toHaveLength(0)
  } finally {
    saveReport()
    await context.close()
  }
})
