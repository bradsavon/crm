import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display dashboard with stats', async ({ page }) => {
    // Wait for stats to load
    await page.waitForResponse((response) => 
      response.url().includes('/api/stats') && response.status() === 200
    );

    // Check for stat cards
    await expect(page.locator('text=/contacts|companies|cases/i')).toBeVisible();
  });

  test('should display quick action links', async ({ page }) => {
    // Check for quick action buttons/links
    await expect(page.locator('text=/New Contact|New Company|New Case/i').first()).toBeVisible();
  });

  test('should display My Tasks widget', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForResponse((response) => 
      response.url().includes('/api/tasks/my') && response.status() === 200
    );

    // Check for tasks section
    await expect(page.locator('text=/My Tasks|Tasks/i')).toBeVisible();
  });

  test('should navigate to contacts page', async ({ page }) => {
    await page.click('text=Contacts');
    await expect(page).toHaveURL('/contacts');
  });

  test('should navigate to companies page', async ({ page }) => {
    await page.click('text=Companies');
    await expect(page).toHaveURL('/companies');
  });

  test('should navigate to cases page', async ({ page }) => {
    await page.click('text=Cases');
    await expect(page).toHaveURL('/cases');
  });

  test('should navigate to tasks page', async ({ page }) => {
    await page.click('text=Tasks');
    await expect(page).toHaveURL('/tasks');
  });

  test('should display navigation bar', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Contacts')).toBeVisible();
    await expect(page.locator('text=Companies')).toBeVisible();
  });
});

