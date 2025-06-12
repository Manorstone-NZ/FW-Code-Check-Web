import { test, expect } from '@playwright/test';

test.describe('Comparisons Page', () => {
  test('can view and select comparison history', async ({ page }) => {
    await page.goto('http://localhost:3000/comparisons');
    await expect(page.getByText('Comparison History')).toBeVisible();
    await expect(page.getByText('Select Analysis')).toBeVisible();
    await expect(page.getByText('Select Baseline')).toBeVisible();
    // Select analysis and baseline (if options exist)
    const analysisSelect = page.getByLabel('Select Analysis');
    const baselineSelect = page.getByLabel('Select Baseline');
    if (await analysisSelect.count() && await baselineSelect.count()) {
      await analysisSelect.selectOption({ index: 1 });
      await baselineSelect.selectOption({ index: 1 });
      // Wait for history to load
      await expect(page.getByText('Previous Comparisons')).toBeVisible();
      // Select a comparison
      await page.getByText(/Comparison Result|LLM/).first().click();
      await expect(page.getByText(/Comparison Result|LLM/)).toBeVisible();
    }
  });
});
