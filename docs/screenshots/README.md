# Screenshots Directory

This directory contains screenshots of the CRM application for the README.

## How to Generate Screenshots

### Option 1: Manual Screenshots
1. Start the development server: `npm run dev`
2. Log in to the application
3. Navigate to each page and take screenshots
4. Save screenshots with the following names:
   - `dashboard.png` - Dashboard page
   - `contacts-list.png` - Contacts list page
   - `contact-detail.png` - Contact detail page
   - `cases-list.png` - Cases list page
   - `case-detail.png` - Case detail page
   - `calendar.png` - Calendar page
   - `meeting-detail.png` - Meeting detail page
   - `tasks-list.png` - Tasks list page
   - `documents.png` - Documents library page
   - `users-list.png` - Users list page

### Option 2: Using Playwright (Automated)
You can use Playwright to automatically generate screenshots:

```bash
# Create a script to take screenshots
npx playwright test --project=chromium --grep="screenshot" || true
```

Or create a custom script in `scripts/generate-screenshots.ts`:

```typescript
import { chromium } from 'playwright';
import { writeFile } from 'fs/promises';
import { join } from 'path';

async function generateScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    storageState: '.auth/user.json', // Use authenticated state
  });
  const page = await context.newPage();

  const baseURL = 'http://localhost:3000';
  const screenshots = [
    { path: '/', name: 'dashboard.png' },
    { path: '/contacts', name: 'contacts-list.png' },
    { path: '/cases', name: 'cases-list.png' },
    { path: '/calendar', name: 'calendar.png' },
    { path: '/tasks', name: 'tasks-list.png' },
    { path: '/documents', name: 'documents.png' },
    { path: '/users', name: 'users-list.png' },
  ];

  for (const { path, name } of screenshots) {
    await page.goto(`${baseURL}${path}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: join(__dirname, '../docs/screenshots', name),
      fullPage: true,
    });
  }

  await browser.close();
}

generateScreenshots();
```

## Screenshot Guidelines

- **Resolution**: Use at least 1920x1080 for desktop screenshots
- **Format**: PNG format for best quality
- **Full Page**: Capture full page when possible (use browser full-page screenshot)
- **Data**: Use sample/test data that looks professional
- **Consistency**: Use the same browser window size for all screenshots
- **Authentication**: Ensure you're logged in before taking screenshots

## Current Status

Screenshots need to be generated and added to this directory. Once added, they will automatically appear in the main README.md file.

