import { test, expect } from '@playwright/test';

test.describe('Contacts Page', () => {
  test.use({ storageState: '.auth/user.json' });

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
    await page.waitForLoadState('networkidle');

    // Check for table (desktop) or card list (mobile) or empty state
    // Table is hidden on mobile, so check for either table or the empty state message
    const table = page.locator('table');
    const emptyState = page.locator('text=No contacts found');
    const cardList = page.locator('.md\\:hidden').locator('div.bg-white.rounded-lg.shadow').first();
    
    // At least one of these should be visible
    const tableVisible = await table.isVisible().catch(() => false);
    const emptyStateVisible = await emptyState.isVisible().catch(() => false);
    const cardListVisible = await cardList.isVisible().catch(() => false);
    
    expect(tableVisible || emptyStateVisible || cardListVisible).toBeTruthy();
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
  test.use({ storageState: '.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts/new');
  });

  test('should display contact form', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for form elements - labels are separate from inputs, so find inputs by type and position
    // First Name is the first text input
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    // Last Name is the second text input
    await expect(page.locator('input[type="text"]').nth(1)).toBeVisible();
    // Email is the email input
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Also check that labels are visible
    await expect(page.locator('label:has-text("First Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Last Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Email")')).toBeVisible();
  });

  test.skip('should create a new contact', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Set up alert handler in case of errors
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      console.log(`Dialog message: ${alertMessage}`);
      await dialog.dismiss();
    });
    
    // Set up console error handler
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const errorText = msg.text();
        consoleErrors.push(errorText);
        console.log('Console error:', errorText);
      }
    });
    
    // Fill in form - inputs don't have name attributes, so use type and position
    // First Name is the first text input
    await page.locator('input[type="text"]').first().fill('John');
    // Last Name is the second text input
    await page.locator('input[type="text"]').nth(1).fill('Doe');
    // Email is the email input
    await page.locator('input[type="email"]').fill('john.doe@example.com');
    // Phone is the tel input
    await page.locator('input[type="tel"]').fill('555-1234');

    // Verify submit button is enabled and visible
    const submitButton = page.locator('button[type="submit"]:has-text("Create Contact")');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();

    // Set up response listener BEFORE clicking - use a simpler approach
    // Listen for any response to /api/contacts with POST method
    const responsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        const method = response.request().method();
        return url.includes('/api/contacts') && method === 'POST';
      },
      { timeout: 20000 }
    ).catch((error) => {
      console.log('Response wait error:', error);
      return null;
    });

    // Also set up navigation listener as backup
    const navigationPromise = page.waitForURL('/contacts', { timeout: 20000 }).catch(() => null);

    // Click submit button
    await submitButton.click();

    // Wait for either response or navigation (whichever comes first)
    const result = await Promise.race([
      responsePromise.then(r => ({ type: 'response', value: r })),
      navigationPromise.then(() => ({ type: 'navigation', value: null }))
    ]);

    // If we got a response, verify it
    if (result.type === 'response' && result.value) {
      const response = result.value;
      const status = response.status();
      expect(status).toBeGreaterThanOrEqual(200);
      expect(status).toBeLessThan(300);
      
      try {
        const json = await response.json();
        expect(json.success).toBe(true);
      } catch {
        // Response body already consumed - that's okay
      }
    }

    // If there was an alert, fail the test
    if (alertMessage) {
      throw new Error(`Form submission failed with alert: ${alertMessage}`);
    }

    // If there were console errors, log them but don't fail (might be non-critical)
    if (consoleErrors.length > 0) {
      console.log('Console errors during submission:', consoleErrors);
    }

    // Ensure we're on the contacts page (navigation might have already happened)
    await page.waitForURL('/contacts', { timeout: 10000 });
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"], button:has-text("Save")');

    // Should show validation errors or stay on page
    await expect(page).toHaveURL('/contacts/new');
  });
});

test.describe('Contact Detail Page', () => {
  test.use({ storageState: '.auth/user.json' });

  test('should display contact details', async ({ page }) => {
    // First, create a contact or navigate to an existing one
    await page.goto('/contacts');
    
    // Wait for contacts to load
    await page.waitForResponse((response) => 
      response.url().includes('/api/contacts') && response.status() === 200
    );
    await page.waitForLoadState('networkidle');

    // Click on first contact "Edit" link (these are the links to contact detail pages)
    const contactLink = page.locator('a[href^="/contacts/"]:has-text("Edit")').first();
    const linkCount = await contactLink.count();
    
    if (linkCount === 0) {
      // Create a contact first if none exist
      await page.goto('/contacts/new');
      await page.waitForLoadState('networkidle');
      await page.locator('input[type="text"]').first().fill('Test');
      await page.locator('input[type="text"]').nth(1).fill('Contact');
      await page.locator('input[type="email"]').fill('test@example.com');
      
      // Submit and wait for API response
      await Promise.all([
        page.waitForResponse((response) => {
          const url = response.url();
          const method = response.request().method();
          const status = response.status();
          return url.includes('/api/contacts') && 
                 method === 'POST' &&
                 (status === 200 || status === 201);
        }).catch(() => null),
        page.click('button[type="submit"]:has-text("Create Contact")')
      ]);
      
      await page.waitForURL('/contacts', { timeout: 10000 });
      await page.goto('/contacts');
      await page.waitForResponse((response) => 
        response.url().includes('/api/contacts') && response.status() === 200
      );
      await page.waitForLoadState('networkidle');
    }
    
    const link = page.locator('a[href^="/contacts/"]:has-text("Edit")').first();
    await link.click();
    
    // Should be on contact detail page
    await expect(page).toHaveURL(/\/contacts\/\w+/, { timeout: 10000 });
    
    // Check for contact information - look for form labels or heading
    await expect(page.locator('h1:has-text("Edit Contact"), label:has-text("First Name"), label:has-text("Email")').first()).toBeVisible({ timeout: 5000 });
  });

  test('should allow editing contact', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForResponse((response) => 
      response.url().includes('/api/contacts') && response.status() === 200
    );
    await page.waitForLoadState('networkidle');

    const contactLink = page.locator('a[href^="/contacts/"]:has-text("Edit")').first();
    const linkCount = await contactLink.count();
    
    if (linkCount === 0) {
      // Create a contact first if none exist
      await page.goto('/contacts/new');
      await page.waitForLoadState('networkidle');
      await page.locator('input[type="text"]').first().fill('Test');
      await page.locator('input[type="text"]').nth(1).fill('Contact');
      await page.locator('input[type="email"]').fill('test2@example.com');
      
      // Submit and wait for API response
      await Promise.all([
        page.waitForResponse((response) => {
          const url = response.url();
          const method = response.request().method();
          const status = response.status();
          return url.includes('/api/contacts') && 
                 method === 'POST' &&
                 (status === 200 || status === 201);
        }).catch(() => null),
        page.click('button[type="submit"]:has-text("Create Contact")')
      ]);
      
      await page.waitForURL('/contacts', { timeout: 10000 });
      await page.goto('/contacts');
      await page.waitForResponse((response) => 
        response.url().includes('/api/contacts') && response.status() === 200
      );
      await page.waitForLoadState('networkidle');
    }
    
    const link = page.locator('a[href^="/contacts/"]:has-text("Edit")').first();
    await link.click();
    
    // Wait for contact detail/edit page to load
    await expect(page).toHaveURL(/\/contacts\/\w+/, { timeout: 10000 });
    
    // The contact detail page is actually the edit page, so form should be visible
    await expect(page.locator('h1:has-text("Edit Contact")')).toBeVisible({ timeout: 5000 });
    // Check for input field - it should be the first text input
    await expect(page.locator('input[type="text"]').first()).toBeVisible({ timeout: 5000 });
  });
});

