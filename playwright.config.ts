// @ts-check
/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: './playwright/tests',
  timeout: 30 * 1000,
  retries: 0,
  use: {
    headless: true,
    baseURL: 'http://localhost:3000', // Change if your app runs elsewhere
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
};

export default config;
