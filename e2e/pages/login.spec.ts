import { test, expect } from '@playwright/test';
import { loginUser } from '../fixtures/test-helpers';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.locator('text=/invalid|error|failed/i')).toBeVisible({ timeout: 5000 });
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL || 'admin@crm.com';
    const password = process.env.TEST_USER_PASSWORD || 'admin123';

    await loginUser(page, email, password);

    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Browser validation should prevent submission or show error
    // The form should still be on the login page
    await expect(page).toHaveURL('/login');
  });

  test('should navigate to login from other pages when not authenticated', async ({ page }) => {
    // Try to access protected page
    await page.goto('/contacts');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });
});

