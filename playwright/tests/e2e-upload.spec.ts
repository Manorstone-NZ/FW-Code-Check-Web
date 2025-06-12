import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// This test assumes your app is running at http://localhost:3000
// and that the file upload page is accessible at /upload

test.describe('File Upload E2E', () => {
  test('uploads a PLC file and sees it in the UI', async ({ page }) => {
    await page.goto('http://localhost:3000/upload');
    // Find the file input (adjust selector as needed)
    const fileInput = await page.locator('input[type="file"]');
    // Create a dummy file to upload
    const testFilePath = path.resolve(__dirname, '../../testfile.txt');
    if (!fs.existsSync(testFilePath)) {
      fs.writeFileSync(testFilePath, 'TEST PLC FILE CONTENT');
    }
    // Upload the file
    await fileInput.setInputFiles(testFilePath);
    // Click the upload button (adjust selector as needed)
    await page.getByRole('button', { name: /upload/i }).click();
    // Wait for the file to appear in the UI (adjust text as needed)
    await expect(page.getByText('testfile.txt')).toBeVisible();
  });
});
