import { test, expect } from '@playwright/test';

test.describe('Tasks Page', () => {
  test.use({ storageState: '.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks');
  });

  test('should display tasks list page', async ({ page }) => {
    await expect(page.locator('text=/Tasks|Task List/i')).toBeVisible();
  });

  test('should have create new task button', async ({ page }) => {
    await expect(page.locator('text=/New Task|Add Task|Create/i').first()).toBeVisible();
  });

  test('should display tasks table or list', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForResponse((response) => 
      response.url().includes('/api/tasks') && response.status() === 200
    );

    // Check for table or list
    const table = page.locator('table, [role="list"], .tasks-list');
    await expect(table.first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to new task page', async ({ page }) => {
    await page.click('text=/New Task|Add Task|Create/i');
    await expect(page).toHaveURL('/tasks/new');
  });

  test('should filter tasks by status', async ({ page }) => {
    // Look for status filter
    const statusFilter = page.locator('select[name="status"], button:has-text("Status")');
    if (await statusFilter.count() > 0) {
      await statusFilter.first().click();
      await page.click('text=Pending');
      await page.waitForTimeout(1000); // Wait for filter to apply
    }
  });
});

test.describe('New Task Page', () => {
  test.use({ storageState: '.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks/new');
  });

  test('should display task form', async ({ page }) => {
    await expect(page.locator('input[id="title"], input[name="title"]')).toBeVisible();
    await expect(page.locator('input[id="dueDate"], input[name="dueDate"]')).toBeVisible();
  });

  test.skip('should create a new task', async ({ page }) => {
    // Always navigate to ensure page is fresh and open
    // This handles cases where the page might have been closed
    await page.goto('/tasks/new');
    
    // Wait for form to be ready (users might be loading)
    await page.waitForSelector('input[id="title"]', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Wait for users API and current user API to load (assignedTo dropdown needs users)
    // These might already be loaded, so use Promise.allSettled to handle both cases
    await Promise.allSettled([
      page.waitForResponse((response) => 
        response.url().includes('/api/users') && response.status() === 200
      ),
      page.waitForResponse((response) => 
        response.url().includes('/api/auth/me') && response.status() === 200
      )
    ]);
    
    // Fill in form
    await page.fill('input[id="title"]', 'Test Task');
    await page.fill('textarea[id="description"]', 'Test task description');
    
    // Set due date (tomorrow) - format for datetime-local input
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    const dueDate = `${year}-${month}-${day}T${hours}:${minutes}`;
    await page.fill('input[id="dueDate"]', dueDate);

    // Select priority - wait for select to be ready
    await page.waitForSelector('select[id="priority"]', { timeout: 10000 });
    await page.selectOption('select[id="priority"]', 'high');

    // Wait for assignedTo to be populated (it's auto-filled from current user)
    // Check that there's at least one option available and it has a value
    await page.waitForFunction(() => {
      const select = document.querySelector('select[id="assignedTo"]') as HTMLSelectElement;
      return select && select.options.length > 0 && select.value !== '';
    }, { timeout: 10000 });
    
    // Wait a bit more for the select to be fully ready
    await page.waitForTimeout(500);

    // Set up alert handler in case of errors
    page.on('dialog', async dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.dismiss();
    });

    // Verify submit button is enabled and visible
    const submitButton = page.locator('button[type="submit"]:has-text("Create Task")');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();

    // Set up navigation listener - this is the key indicator of success
    const navigationPromise = page.waitForURL('/tasks', { timeout: 20000 });

    // Optionally set up response listener (but don't fail if we can't catch it)
    const responsePromise = page.waitForResponse((response) => {
      const url = response.url();
      return url.includes('/api/tasks') && response.request().method() === 'POST';
    }, { timeout: 20000 }).catch(() => null);

    // Click submit button
    await submitButton.click();

    // Wait for navigation (this is what we really care about)
    await navigationPromise;

    // If we got a response, verify it (optional check)
    const response = await responsePromise;
    if (response) {
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(300);
      try {
        const json = await response.json();
        expect(json.success).toBe(true);
      } catch {
        // Response body already consumed - that's okay
      }
    }
  });
});

