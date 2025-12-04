# E2E Testing Guide

This directory contains End-to-End (E2E) tests for the CRM Next.js application using Playwright.

## Quick Start

1. **Install dependencies** (if not already installed):
   ```bash
   npm install
   npx playwright install --with-deps chromium
   ```

2. **Set up authentication** (first time only):
   ```bash
   npx playwright test e2e/auth.setup.ts
   ```

3. **Run E2E tests**:
   ```bash
   npm run test:e2e
   ```

## Directory Structure

```
e2e/
├── auth.setup.ts          # Authentication setup script
├── fixtures/              # Test helpers
│   └── test-helpers.ts    # Reusable helper functions
├── pages/                 # Page component tests
│   ├── login.spec.ts      # Login page tests
│   ├── dashboard.spec.ts  # Dashboard page tests
│   ├── contacts.spec.ts   # Contacts page tests
│   ├── tasks.spec.ts      # Tasks page tests
│   └── navigation.spec.ts # Navigation tests
└── README.md             # This file
```

## Test Organization

### Fixtures

- **auth.setup.ts**: Sets up authenticated user session (located in `e2e/auth.setup.ts`)
- **test-helpers.ts**: Common helper functions for tests

### Page Tests

Each page component has its own test file:
- Tests page rendering
- Tests user interactions
- Tests navigation
- Tests form submissions
- Tests error handling

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### Specific Test File
```bash
npx playwright test e2e/pages/login.spec.ts
```

### UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

### Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### View Report
```bash
npm run test:e2e:report
```

## Environment Variables

Set these environment variables for E2E tests:

- `BASE_URL`: Base URL for the application (default: `http://localhost:3000`)
- `TEST_USER_EMAIL`: Test user email (default: `admin@crm.com`)
- `TEST_USER_PASSWORD`: Test user password (default: `admin123`)

## Writing New Tests

1. Create a new test file in `e2e/pages/` directory
2. Use authenticated state: `test.use({ storageState: '.auth/user.json' })` (the setup project automatically creates this)
3. Import helpers from `../fixtures/test-helpers`
4. Follow existing test patterns

Example:
```typescript
import { test, expect } from '@playwright/test';

test.describe('New Page', () => {
  test.use({ storageState: '.auth/user.json' });

  test('should display page content', async ({ page }) => {
    await page.goto('/new-page');
    await expect(page.locator('text=Expected Content')).toBeVisible();
  });
});
```

**Note**: The authentication setup runs automatically via the `setup` project in `playwright.config.ts`, so you don't need to manually run `auth.setup.ts` unless you need to refresh the session.

## Troubleshooting

### Tests Fail with "Not Authenticated"
The auth setup should run automatically via the `setup` project. If you need to manually refresh the session:
```bash
npx playwright test e2e/auth.setup.ts
```

### Tests Timeout
- Check if dev server is running on port 3000
- Increase timeout in test or config
- Check network tab for failed API calls

### Browser Not Found
Install browsers:
```bash
npx playwright install --with-deps chromium
```

## Best Practices

1. Use authenticated state for protected pages (automatically provided by setup project)
2. Wait for API responses before asserting
3. Use data-testid attributes when possible
4. Keep tests independent and isolated
5. Test complete user flows, not just individual actions
6. Use `waitForLoadState('networkidle')` after navigation to ensure page is fully loaded
7. Handle alerts and dialogs that might block navigation

## Known Issues

Some E2E tests are currently skipped due to form submission timing issues:
- `New Contact Page > should create a new contact` (skipped)
- `New Task Page > should create a new task` (skipped)

These tests can be re-enabled once the underlying navigation and API response timing issues are resolved.

