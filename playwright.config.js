import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45000,
  expect: { timeout: 10000 },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'qa-artifacts/playwright-report', open: 'never' }],
    ['json', { outputFile: 'qa-artifacts/playwright-results.json' }]
  ],
  outputDir: 'qa-artifacts/test-results',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'desktop-smoke', testIgnore: '**/visual.spec.js', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-smoke', testIgnore: '**/visual.spec.js', use: { ...devices['Pixel 7'] } },
    { name: 'visual-qa', testMatch: '**/visual.spec.js', use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  }
});
