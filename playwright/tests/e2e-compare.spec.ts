import { test, expect } from '@playwright/test';

test.describe('Compare Analysis to Baseline', () => {
  test('can select baseline and run LLM comparison', async ({ page }) => {
    await page.goto('http://localhost:3000/analysis');
    // View details and open compare
    await page.getByRole('button', { name: /view/i }).first().click();
    await page.getByText('Compare Analysis to Baseline').click();
    await expect(page.getByText('Select Baseline to Compare:')).toBeVisible();
    // Select a baseline
    await page.getByRole('combobox').selectOption({ index: 1 });
    await expect(page.getByText(/differ/i)).toBeVisible();
    // Run LLM comparison
    await page.getByRole('button', { name: /LLM-Powered Detailed Comparison/i }).click();
    await expect(page.getByText(/LLM-Powered PLC File Comparison/i)).toBeVisible();
  });
});
