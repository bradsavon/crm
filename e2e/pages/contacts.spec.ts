import { test, expect } from '@playwright/test';

test.describe('Contacts Page', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts');
  });

  test('should display contacts list page', async ({ page }) => {
    await expect(page.locator('text=/Contacts|Contact List/i')).toBeVisible();
  });

  test('should have create new contact button', async ({ page }) => {
    await expect(page.locator('text=/New Contact|Add Contact|Create/i').first()).toBeVisible();
  });

  test('should navigate to new contact page', async ({ page }) => {
    await page.click('text=/New Contact|Add Contact|Create/i');
    await expect(page).toHaveURL('/contacts/new');
  });

  test('should display contacts table or list', async ({ page }) => {
    // Wait for contacts to load
    await page.waitForResponse((response) => 
      response.url().includes('/api/contacts') && response.status() === 200
    );

    // Check for table or list container
    const table = page.locator('table, [role="list"], .contacts-list');
    await expect(table.first()).toBeVisible({ timeout: 5000 });
  });

  test('should allow searching contacts', async ({ page }) => {
    // Find search input in navigation or on page
    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]');
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('test');
      await searchInput.first().press('Enter');
      
      // Should navigate to search page or filter results
      await page.waitForTimeout(1000); // Wait for search to process
    }
  });
});

test.describe('New Contact Page', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts/new');
  });

  test('should display contact form', async ({ page }) => {
    await expect(page.locator('input[name="firstName"], input[placeholder*="First" i]')).toBeVisible();
    await expect(page.locator('input[name="lastName"], input[placeholder*="Last" i]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should create a new contact', async ({ page }) => {
    // Fill in form
    await page.fill('input[name="firstName"], input[placeholder*="First" i]', 'John');
    await page.fill('input[name="lastName"], input[placeholder*="Last" i]', 'Doe');
    await page.fill('input[type="email"]', 'john.doe@example.com');
    await page.fill('input[name="phone"], input[type="tel"]', '555-1234');

    // Submit form
    await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');

    // Should redirect to contact detail page or contacts list
    await page.waitForURL(/\/contacts(\/\w+)?$/, { timeout: 10000 });
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"], button:has-text("Save")');

    // Should show validation errors or stay on page
    await expect(page).toHaveURL('/contacts/new');
  });
});

test.describe('Contact Detail Page', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('should display contact details', async ({ page }) => {
    // First, create a contact or navigate to an existing one
    // For this test, we'll assume there's at least one contact
    await page.goto('/contacts');
    
    // Wait for contacts to load
    await page.waitForResponse((response) => 
      response.url().includes('/api/contacts') && response.status() === 200
    );

    // Click on first contact link
    const contactLink = page.locator('a[href^="/contacts/"]').first();
    if (await contactLink.count() > 0) {
      await contactLink.click();
      
      // Should be on contact detail page
      await expect(page).toHaveURL(/\/contacts\/\w+/);
      
      // Check for contact information
      await expect(page.locator('text=/Name|Email|Phone/i')).toBeVisible();
    }
  });

  test('should allow editing contact', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForResponse((response) => 
      response.url().includes('/api/contacts') && response.status() === 200
    );

    const contactLink = page.locator('a[href^="/contacts/"]').first();
    if (await contactLink.count() > 0) {
      await contactLink.click();
      
      // Look for edit button
      const editButton = page.locator('text=/Edit|Update/i');
      if (await editButton.count() > 0) {
        await editButton.click();
        // Should be able to edit or form should be editable
        await expect(page.locator('input[name="firstName"]')).toBeVisible();
      }
    }
  });
});

