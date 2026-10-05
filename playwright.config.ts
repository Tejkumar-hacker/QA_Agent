import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // In banking, concurrency tests are tightly orchestrated
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/playwright-report', open: 'never' }],
    ['junit', { outputFile: 'reports/junit-results.xml' }],
    ['json', { outputFile: 'reports/test-results.json' }]
  ],
  use: {
    baseURL: process.env.COREBANK_BASE_URL || 'https://qa-banking.bankdomain.internal',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'X-Client-Platform': 'CoreBank-QA-Agent-Engine'
    }
  },
  projects: [
    {
      name: 'ui-chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /tests\/ui\/.*\.spec\.ts/
    },
    {
      name: 'api',
      testMatch: /tests\/api\/.*\.spec\.ts/
    }
  ],
  outputDir: 'artifacts/test-results'
});
