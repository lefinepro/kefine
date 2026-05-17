import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const baseURL = process.env.PW_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const skipWebServer = process.env.PW_SKIP_WEB_SERVER === '1';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry'
  },
  webServer: skipWebServer
    ? undefined
    : {
        command: `pnpm dev -- --host 127.0.0.1 --port ${PORT}`,
        port: PORT,
        reuseExistingServer: !process.env.CI,
        timeout: 120000
      },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 5']
      }
    }
  ]
});
