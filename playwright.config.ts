import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3002',
    viewport: { width: 1280, height: 800 },
    headless: true,
    // Capture screenshots on failure for debugging
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev --port 3002',
    url: 'http://localhost:3002',
    // Always start our own server — avoids accidentally hitting a different
    // app that may be running on port 3000.
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
