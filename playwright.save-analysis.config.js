const { PlaywrightTestConfig } = require('@playwright/test');

/**
 * Playwright Test Configuration for Save Analysis Testing
 * 
 * This configuration specifically targets the save-analysis functionality
 * and ensures comprehensive testing of the upload -> analyze -> save -> display workflow.
 */

const config = {
  testDir: './tests',
  timeout: 120000, // 2 minutes per test (analysis can take time)
  expect: {
    timeout: 15000 // 15 seconds for assertions
  },
  fullyParallel: false, // Run tests sequentially to avoid database conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Retry failed tests
  workers: 1, // Single worker to avoid database conflicts
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/save-analysis-results.json' }],
    ['line']
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  
  projects: [
    {
      name: 'save-analysis-functionality',
      testMatch: '**/test_save_analysis_*.js',
      use: {
        // Electron-specific settings
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor'],
          slowMo: 50 // Slow down for better reliability
        }
      }
    },
    {
      name: 'save-analysis-integration',
      testMatch: '**/test_save_analysis_integration.js',
      use: {
        launchOptions: {
          args: ['--disable-web-security'],
          slowMo: 100
        }
      }
    }
  ]
};

module.exports = config;
