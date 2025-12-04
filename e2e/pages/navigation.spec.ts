import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.use({ storageState: '.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display all navigation links', async ({ page }) => {
    // Wait for navigation to load
    await page.waitForLoadState('networkidle');
    
    // Check for navigation links specifically (not just any text on the page)
    await expect(page.locator('nav a:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Contacts")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Companies")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Cases")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Tasks")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Calendar")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Documents")')).toBeVisible();
  });

  test('should navigate between pages', async ({ page }) => {
    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
    
    // Test navigation to different pages
    // Start from home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const contactsLink = page.locator('nav a:has-text("Contacts")');
    await expect(contactsLink).toBeVisible();
    await Promise.all([
      page.waitForURL('/contacts', { timeout: 10000 }),
      contactsLink.click()
    ]);

    const companiesLink = page.locator('nav a:has-text("Companies")');
    await expect(companiesLink).toBeVisible();
    await Promise.all([
      page.waitForURL('/companies', { timeout: 10000 }),
      companiesLink.click()
    ]);

    const casesLink = page.locator('nav a:has-text("Cases")');
    await expect(casesLink).toBeVisible();
    await Promise.all([
      page.waitForURL('/cases', { timeout: 10000 }),
      casesLink.click()
    ]);

    const tasksLink = page.locator('nav a:has-text("Tasks")');
    await expect(tasksLink).toBeVisible();
    await Promise.all([
      page.waitForURL('/tasks', { timeout: 10000 }),
      tasksLink.click()
    ]);

    const calendarLink = page.locator('nav a:has-text("Calendar")');
    await expect(calendarLink).toBeVisible();
    await Promise.all([
      page.waitForURL('/calendar', { timeout: 10000 }),
      calendarLink.click()
    ]);

    const documentsLink = page.locator('nav a:has-text("Documents")');
    await expect(documentsLink).toBeVisible();
    await Promise.all([
      page.waitForURL('/documents', { timeout: 10000 }),
      documentsLink.click()
    ]);
  });

  test('should display user menu when logged in', async ({ page }) => {
    // Should show user info or logout button
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
  });

  test('should allow logout', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click logout button specifically
    await page.locator('button:has-text("Logout")').click();
    await expect(page).toHaveURL('/login', { timeout: 10000 });
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search" i]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('test query');
      await searchInput.press('Enter');
      await expect(page).toHaveURL(/\/search/);
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Reload page to trigger mobile layout
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for page to adjust to mobile layout
    await page.waitForTimeout(500);

    // Check for mobile menu button - it should be visible in mobile view
    // The button is in the lg:hidden section (visible on mobile, hidden on desktop)
    const menuButton = page.locator('button[aria-label="Menu"]');
    await expect(menuButton).toBeVisible({ timeout: 5000 });
    
    // Verify desktop nav is hidden (it has class "hidden lg:flex")
    const desktopNav = page.locator('.hidden.lg\\:flex');
    const isDesktopNavHidden = await desktopNav.isVisible().catch(() => false);
    expect(isDesktopNavHidden).toBe(false); // Desktop nav should be hidden on mobile
    
    // Click menu button to open mobile menu
    await menuButton.click();
    
    // Wait for mobile menu to open (it's conditionally rendered based on mobileMenuOpen state)
    // The mobile menu is in a div that appears when mobileMenuOpen is true
    // Look for the mobile menu container div
    await page.waitForSelector('nav .pb-4.border-t', { timeout: 5000 });
    
    // Mobile menu should be visible - check for navigation links in the mobile menu
    // The mobile menu shows links when open, check for Dashboard link specifically in mobile menu
    const mobileNavLink = page.locator('nav .pb-4.border-t a:has-text("Dashboard")');
    await expect(mobileNavLink).toBeVisible({ timeout: 5000 });
  });
});

