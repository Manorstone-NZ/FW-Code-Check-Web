import { test, expect } from '@playwright/test';

// This assumes your app is running at http://localhost:3000 or similar.
// Adjust the baseURL as needed for your dev server or Electron app.

test.describe('First Watch PLC Code Checker E2E', () => {
  test('Sidebar navigation and LLM status', async ({ page }) => {
    await page.goto('http://localhost:3000'); // Change if your app runs elsewhere
    // Check Sidebar links
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Upload')).toBeVisible();
    await expect(page.getByText('Baselines')).toBeVisible();
    await expect(page.getByText('Analysis')).toBeVisible();
    await expect(page.getByText('Comparisons')).toBeVisible();
    await expect(page.queryByText('LLM Log')).toBeNull();
    // Check LLM status indicator
    await expect(page.getByText(/LLM:/)).toBeVisible();
  });

  // Add more E2E tests for file upload, analysis, etc. as needed
});
