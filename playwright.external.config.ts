import { defineConfig, devices } from '@playwright/test';

// Config for external validation tests (external.spec.ts only).
// No webServer — tests navigate directly to nodule.pulm.icu.
// Run all 29 patients:  pnpm test:e2e:external
// Run curated 6:        pnpm test:e2e:external:quick

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/external.spec.ts',
  timeout: 45_000,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    viewport: { width: 1280, height: 800 },
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
