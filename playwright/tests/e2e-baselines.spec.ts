import { test, expect } from '@playwright/test';

test.describe('Baselines Page', () => {
  test('can view, export, and delete a baseline', async ({ page }) => {
    await page.goto('http://localhost:3000/baselines');
    await expect(page.getByText('Baselines')).toBeVisible();
    // View details
    await page.getByRole('button', { name: /view/i }).first().click();
    await expect(page.getByText('Baseline Details')).toBeVisible();
    // Export (should trigger download, but we just check button exists)
    await expect(page.getByRole('button', { name: /export/i })).toBeVisible();
    // Delete
    await page.getByRole('button', { name: /delete/i }).first().click();
    // Confirm deletion visually (baseline row disappears or details close)
    await expect(page.getByText('Baseline Details')).not.toBeVisible();
  });
});
