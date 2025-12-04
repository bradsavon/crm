import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.use({ storageState: '.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display dashboard with stats', async ({ page }) => {
    // Wait for stats to load
    await page.waitForResponse((response) => 
      response.url().includes('/api/stats') && response.status() === 200
    );

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Check for stat cards - look for specific stat labels (they're in <p> tags)
    await expect(page.locator('p:has-text("Total Contacts")')).toBeVisible({ timeout: 5000 });
  });

  test('should display quick action links', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for quick action buttons/links - they're Link components with specific text
    await expect(page.locator('a:has-text("Add Contact"), a:has-text("Add Company"), a:has-text("Add Case")').first()).toBeVisible({ timeout: 5000 });
  });

  test('should display My Tasks widget', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForResponse((response) => 
      response.url().includes('/api/tasks/my') && response.status() === 200
    );

    // Check for tasks section - look for "My Tasks" heading
    await expect(page.locator('h2:has-text("My Tasks")')).toBeVisible();
  });

  test('should navigate to contacts page', async ({ page }) => {
    // Wait for navigation to be ready
    await page.waitForLoadState('networkidle');
    
    // Use nav link selector to avoid clicking on other "Contacts" text
    // Wait for the link to be visible and clickable
    const contactsLink = page.locator('nav a:has-text("Contacts")');
    await expect(contactsLink).toBeVisible();
    
    // Click and wait for navigation
    await Promise.all([
      page.waitForURL('/contacts', { timeout: 5000 }),
      contactsLink.click()
    ]);
  });

  test('should navigate to companies page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const companiesLink = page.locator('nav a:has-text("Companies")');
    await expect(companiesLink).toBeVisible();
    await Promise.all([
      page.waitForURL('/companies', { timeout: 5000 }),
      companiesLink.click()
    ]);
  });

  test('should navigate to cases page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const casesLink = page.locator('nav a:has-text("Cases")');
    await expect(casesLink).toBeVisible();
    await Promise.all([
      page.waitForURL('/cases', { timeout: 5000 }),
      casesLink.click()
    ]);
  });

  test('should navigate to tasks page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const tasksLink = page.locator('nav a:has-text("Tasks")');
    await expect(tasksLink).toBeVisible();
    await Promise.all([
      page.waitForURL('/tasks', { timeout: 5000 }),
      tasksLink.click()
    ]);
  });

  test('should display navigation bar', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Contacts')).toBeVisible();
    await expect(page.locator('text=Companies')).toBeVisible();
  });
});

