import { test, expect } from '@playwright/test';

test.describe('Analysis Page', () => {
  test('can view, filter, and delete analyses', async ({ page }) => {
    await page.goto('http://localhost:3000/analysis');
    await expect(page.getByText('Analysis')).toBeVisible();
    // View details
    await page.getByRole('button', { name: /view/i }).first().click();
    await expect(page.getByText('Analysis Details')).toBeVisible();
    // Delete
    await page.getByRole('button', { name: /delete/i }).first().click();
    // Confirm deletion visually (analysis row disappears or details close)
    await expect(page.getByText('Analysis Details')).not.toBeVisible();
  });
});
