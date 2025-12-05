import { test } from '@playwright/test';
import { existsSync } from 'fs';
import { join } from 'path';

test.describe('Generate Screenshots', () => {
  test.use({ 
    storageState: existsSync('.auth/user.json') ? '.auth/user.json' : undefined,
  });

  test('capture all screenshots', async ({ page }) => {
    const baseURL = process.env.BASE_URL || 'http://localhost:3000';
    const screenshotsDir = join(process.cwd(), 'docs', 'screenshots');

    const screenshots = [
      { path: '/', name: 'dashboard.png', description: 'Dashboard page' },
      { path: '/contacts', name: 'contacts-list.png', description: 'Contacts list page' },
      { path: '/cases', name: 'cases-list.png', description: 'Cases list page' },
      { path: '/calendar', name: 'calendar.png', description: 'Calendar page' },
      { path: '/tasks', name: 'tasks-list.png', description: 'Tasks list page' },
      { path: '/documents', name: 'documents.png', description: 'Documents library page' },
      { path: '/users', name: 'users-list.png', description: 'Users list page' },
    ];

    for (const { path, name, description } of screenshots) {
      console.log(`Capturing ${description}...`);
      await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: join(screenshotsDir, name),
        fullPage: true,
      });
      console.log(`  ✓ Saved: ${name}`);
    }

    // Try to capture detail pages
    try {
      await page.goto(`${baseURL}/contacts`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      const contactLink = page.locator('a[href^="/contacts/"]').first();
      if (await contactLink.count() > 0) {
        const href = await contactLink.getAttribute('href');
        if (href) {
          console.log(`Capturing contact detail page...`);
          await page.goto(`${baseURL}${href}`, { waitUntil: 'networkidle' });
          await page.waitForTimeout(1000);
          await page.screenshot({
            path: join(screenshotsDir, 'contact-detail.png'),
            fullPage: true,
          });
          console.log(`  ✓ Saved: contact-detail.png`);
        }
      }
    } catch (error: any) {
      console.log(`  ⚠ Skipped contact detail: ${error.message}`);
    }

    try {
      await page.goto(`${baseURL}/cases`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      const caseLink = page.locator('a[href^="/cases/"]').first();
      if (await caseLink.count() > 0) {
        const href = await caseLink.getAttribute('href');
        if (href) {
          console.log(`Capturing case detail page...`);
          await page.goto(`${baseURL}${href}`, { waitUntil: 'networkidle' });
          await page.waitForTimeout(1000);
          await page.screenshot({
            path: join(screenshotsDir, 'case-detail.png'),
            fullPage: true,
          });
          console.log(`  ✓ Saved: case-detail.png`);
        }
      }
    } catch (error: any) {
      console.log(`  ⚠ Skipped case detail: ${error.message}`);
    }

    try {
      await page.goto(`${baseURL}/calendar`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      const meetingEvent = page.locator('.fc-event').first();
      if (await meetingEvent.count() > 0) {
        await meetingEvent.click();
        await page.waitForTimeout(1000);
        const currentUrl = page.url();
        if (currentUrl.includes('/meetings/')) {
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);
          await page.screenshot({
            path: join(screenshotsDir, 'meeting-detail.png'),
            fullPage: true,
          });
          console.log(`  ✓ Saved: meeting-detail.png`);
        }
      }
    } catch (error: any) {
      console.log(`  ⚠ Skipped meeting detail: ${error.message}`);
    }
  });
});

