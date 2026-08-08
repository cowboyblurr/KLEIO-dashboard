import { test, expect } from "@playwright/test"

const BASE_URL = process.env.V4_BROWSER_BASE_URL || "http://127.0.0.1:4173"
const RUN_ID = process.env.GITHUB_RUN_ID || `${Date.now()}`
const widths = [320, 360, 375, 390, 430, 768, 1440]

async function noOverflow(page, label) {
  const measure = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
  }))
  expect(measure.scrollWidth - measure.width, `${label} horizontal overflow`).toBeLessThanOrEqual(4)
}

async function viewportMatrix(page, route, label) {
  for (const width of widths) {
    await page.setViewportSize({ width, height: width >= 1000 ? 900 : 844 })
    await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(350)
    await expect(page.locator("main")).toBeVisible()
    await noOverflow(page, `${label}-${width}`)
  }
  await page.setViewportSize({ width: 844, height: 390 })
  await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" })
  await noOverflow(page, `${label}-landscape-844x390`)
  await page.setViewportSize({ width: 390, height: 420 })
  await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" })
  await noOverflow(page, `${label}-keyboard-like-390x420`)
}

test.describe.configure({ mode: "serial", timeout: 120_000 })

test("public signup renders across V4 width matrix and exposes current rate-limit failure safely", async ({ page }) => {
  const consoleErrors = []
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()) })
  await viewportMatrix(page, "/signup/artist/", "artist-signup")

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_URL}/signup/artist/`, { waitUntil: "domcontentloaded" })
  await page.getByLabel(/Professional or display name/i).fill("KLEIO V4 Signup Browser Probe")
  await page.getByLabel(/^Email/i).fill(`qa-v4-browser-${RUN_ID}@kleioarthouse.com`)
  const password = `V4!Browser-${RUN_ID}-Aa1!`
  const passwords = page.locator('input[type="password"]')
  await passwords.nth(0).fill(password)
  await passwords.nth(1).fill(password)
  const checkbox = page.locator('input[type="checkbox"]').first()
  await checkbox.check()
  await page.getByRole("button", { name: /Create account|Create artist account|Continue/i }).last().click()
  await page.waitForTimeout(800)
  const body = await page.locator("body").innerText()
  expect(body).toMatch(/cannot send another confirmation email yet|Too many attempts were made|email limit may take up to an hour/i)
  expect(body).not.toMatch(/AuthApiError|over_email_send_rate_limit|FunctionsHttpError|stack trace|SQL error/i)
  expect(consoleErrors.filter((item) => !/favicon/i.test(item))).toHaveLength(0)
})

test("recipient invalid-token and synthetic demo states render safely across V4 widths", async ({ page }) => {
  await viewportMatrix(page, "/application-review/?token=definitely-not-a-valid-v4-token", "recipient-invalid")
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_URL}/application-review/?token=definitely-not-a-valid-v4-token`, { waitUntil: "domcontentloaded" })
  await expect(page.getByText("Application access unavailable")).toBeVisible({ timeout: 15_000 })
  const invalidBody = await page.locator("body").innerText()
  expect(invalidBody).not.toMatch(/FunctionsHttpError|application_recipient_access|SQL error|raw UUID|stack trace/i)

  await viewportMatrix(page, "/application-review/demo/", "recipient-demo")
  await page.setViewportSize({ width: 720, height: 450 })
  await page.goto(`${BASE_URL}/application-review/demo/`, { waitUntil: "domcontentloaded" })
  await page.evaluate(() => { document.documentElement.style.zoom = "2" })
  await expect(page.getByText("Synthetic preview")).toBeVisible()
  expect(await page.locator("button:visible, a:visible, input:visible, textarea:visible").count()).toBeGreaterThan(0)
  await page.evaluate(() => { document.documentElement.style.zoom = "" })

  await page.getByRole("button", { name: "Message applicant" }).first().focus()
  await page.keyboard.press("Enter")
  await expect(page.getByText(/Write first|Verification/i).first()).toBeVisible()
})
