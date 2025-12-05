import { chromium } from 'playwright';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

async function generateScreenshots() {
  console.log('Starting screenshot generation...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    // Try to use authenticated state if available
    storageState: existsSync('.auth/user.json') ? '.auth/user.json' : undefined,
  });
  const page = await context.newPage();

  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  const screenshotsDir = join(process.cwd(), 'docs', 'screenshots');
  
  // Create screenshots directory if it doesn't exist
  if (!existsSync(screenshotsDir)) {
    await mkdir(screenshotsDir, { recursive: true });
  }

  const screenshots = [
    { path: '/', name: 'dashboard.png', description: 'Dashboard page' },
    { path: '/contacts', name: 'contacts-list.png', description: 'Contacts list page' },
    { path: '/cases', name: 'cases-list.png', description: 'Cases list page' },
    { path: '/calendar', name: 'calendar.png', description: 'Calendar page' },
    { path: '/tasks', name: 'tasks-list.png', description: 'Tasks list page' },
    { path: '/documents', name: 'documents.png', description: 'Documents library page' },
    { path: '/users', name: 'users-list.png', description: 'Users list page' },
  ];

  console.log(`Base URL: ${baseURL}`);
  console.log(`Screenshots directory: ${screenshotsDir}`);

  for (const { path, name, description } of screenshots) {
    try {
      console.log(`Capturing ${description}...`);
      const url = `${baseURL}${path}`;
      console.log(`  Navigating to: ${url}`);
      
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Wait a bit for any animations or dynamic content
      await page.waitForTimeout(1000);
      
      const screenshotPath = join(screenshotsDir, name);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });
      
      console.log(`  ✓ Saved: ${name}`);
    } catch (error: any) {
      console.error(`  ✗ Failed to capture ${name}:`, error.message);
    }
  }

  // Try to capture detail pages (these require existing data)
  try {
    // Try to get a contact ID from the contacts page
    await page.goto(`${baseURL}/contacts`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Look for a contact link
    const contactLink = await page.locator('a[href^="/contacts/"]').first();
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
    console.log(`  ⚠ Skipped contact detail (may need existing data): ${error.message}`);
  }

  try {
    // Try to get a case ID from the cases page
    await page.goto(`${baseURL}/cases`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const caseLink = await page.locator('a[href^="/cases/"]').first();
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
    console.log(`  ⚠ Skipped case detail (may need existing data): ${error.message}`);
  }

  try {
    // Try to get a meeting ID from the calendar
    await page.goto(`${baseURL}/calendar`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Click on a meeting event if available
    const meetingEvent = await page.locator('.fc-event').first();
    if (await meetingEvent.count() > 0) {
      await meetingEvent.click();
      await page.waitForTimeout(1000);
      
      // Check if we navigated to a meeting detail page
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
    console.log(`  ⚠ Skipped meeting detail (may need existing data): ${error.message}`);
  }

  await browser.close();
  console.log('\n✓ Screenshot generation complete!');
  console.log(`Screenshots saved to: ${screenshotsDir}`);
}

// Run if executed directly
if (require.main === module) {
  generateScreenshots().catch((error) => {
    console.error('Error generating screenshots:', error);
    process.exit(1);
  });
}

export default generateScreenshots;

