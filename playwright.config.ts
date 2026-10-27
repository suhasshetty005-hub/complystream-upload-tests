import { defineConfig, devices } from '@playwright/test';

/**
 * One public demo page, no login, no shared server-side state between tests, so this config is
 * deliberately small. Every value below is a choice, not a default left in place.
 */
export default defineConfig({
  testDir: './tests',

  // Tests do not share state (each one navigates to a fresh /upload), so they can run in parallel.
  fullyParallel: true,

  forbidOnly: !!process.env.CI,

  // retries: 0 locally on purpose. The suite contains one test that fails against a real defect
  // (see README). A retry would only run it twice and hide nothing; on CI we allow one retry for
  // Heroku cold starts, which is the only flake source we have actually seen on this host.
  retries: process.env.CI ? 1 : 0,

  reporter: [['list'], ['html', { open: 'never' }]],

  // the-internet runs on Heroku and can take several seconds to wake from idle.
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: process.env.BASE_URL ?? 'https://the-internet.herokuapp.com',
    // Keep the trace for every failure, not only on retry: with retries: 0 locally,
    // 'on-first-retry' would never record one, and the failing test is the one worth tracing.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
