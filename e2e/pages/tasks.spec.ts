import { test, expect } from '@playwright/test';

test.describe('Tasks Page', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

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
  test.use({ storageState: 'e2e/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks/new');
  });

  test('should display task form', async ({ page }) => {
    await expect(page.locator('input[name="title"], input[placeholder*="Title" i]')).toBeVisible();
    await expect(page.locator('input[type="date"], input[name="dueDate"]')).toBeVisible();
  });

  test('should create a new task', async ({ page }) => {
    // Fill in form
    await page.fill('input[name="title"]', 'Test Task');
    await page.fill('textarea[name="description"]', 'Test task description');
    
    // Set due date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDate = tomorrow.toISOString().split('T')[0];
    await page.fill('input[name="dueDate"]', dueDate);

    // Select priority
    const prioritySelect = page.locator('select[name="priority"]');
    if (await prioritySelect.count() > 0) {
      await prioritySelect.selectOption('high');
    }

    // Submit form
    await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');

    // Should redirect to task detail page or tasks list
    await page.waitForURL(/\/tasks(\/\w+)?$/, { timeout: 10000 });
  });
});

