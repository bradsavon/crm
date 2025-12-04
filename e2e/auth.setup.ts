import { test as setup, expect } from '@playwright/test';

const authFile = '.auth/user.json';

/**
 * This setup script authenticates a user and saves the authentication state.
 * This allows other tests to reuse the authenticated session.
 */
setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Fill in login credentials
  // Note: In a real scenario, you'd use test credentials or create a test user
  await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'admin@crm.com');
  await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'admin123');

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard (successful login)
  await page.waitForURL('/', { timeout: 10000 });

  // Verify we're logged in by checking for user-specific content
  await expect(page.locator('text=Dashboard')).toBeVisible();

  // Save authenticated state
  await page.context().storageState({ path: authFile });
});

