import { Page, expect } from '@playwright/test';

/**
 * Helper function to login a user
 */
export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/', { timeout: 10000 });
}

/**
 * Helper function to logout a user
 */
export async function logoutUser(page: Page) {
  await page.click('text=Logout');
  await page.waitForURL('/login', { timeout: 5000 });
}

/**
 * Helper function to wait for API response
 */
export async function waitForAPIResponse(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse((response) => {
    const url = response.url();
    if (typeof urlPattern === 'string') {
      return url.includes(urlPattern);
    }
    return urlPattern.test(url);
  });
}

/**
 * Helper function to check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Check if login link exists (not authenticated) or user menu exists (authenticated)
    const loginLink = page.locator('text=Login');
    const userMenu = page.locator('text=Logout');
    
    if (await loginLink.isVisible()) {
      return false;
    }
    if (await userMenu.isVisible()) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Helper function to navigate to a page and wait for it to load
 */
export async function navigateToPage(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

/**
 * Helper function to fill a form field
 */
export async function fillFormField(
  page: Page,
  label: string,
  value: string,
  fieldType: 'input' | 'textarea' | 'select' = 'input'
) {
  const field = page.locator(`${fieldType}[aria-label="${label}"], ${fieldType}[name="${label}"], label:has-text("${label}") + ${fieldType}`);
  await field.fill(value);
}

/**
 * Helper function to click a button by text
 */
export async function clickButton(page: Page, buttonText: string) {
  await page.click(`button:has-text("${buttonText}")`);
}

/**
 * Helper function to check for toast/notification messages
 */
export async function checkForNotification(page: Page, message: string) {
  await expect(page.locator(`text=${message}`)).toBeVisible({ timeout: 5000 });
}

