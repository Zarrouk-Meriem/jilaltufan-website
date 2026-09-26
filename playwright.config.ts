import { defineConfig, devices } from '@playwright/test'

const port = process.env.PORT ?? '3000'
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`

/**
 * Every request from localhost is one client to the form rate limiters (src/lib/forms/
 * rate-limit.ts, keyed by `x-forwarded-for`), and their buckets live as long as the dev
 * server — so a second run within ten minutes of the first found the apply and reset budgets
 * already spent (2026-09-25). The config is loaded afresh by every worker, so each worker of
 * each run arrives from its own address (198.18.0.0/15, reserved for benchmarking). The
 * limits inside one worker are exactly what a visitor gets.
 */
const clientAddress = `198.18.${Math.floor(Math.random() * 256)}.${1 + Math.floor(Math.random() * 254)}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL, trace: 'on-first-retry', extraHTTPHeaders: { 'x-forwarded-for': clientAddress } },
  webServer: process.env.PLAYWRIGHT_NO_SERVER
    ? undefined
    : {
        command: 'pnpm dev',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 180_000,
      },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /screens\.spec\.ts/ },
    // Screenshot project: not a test, a review tool. Run with `pnpm screens`.
    { name: 'screens', testMatch: /screens\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
  ],
})
