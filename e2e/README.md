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
   npx playwright test e2e/fixtures/auth.setup.ts
   ```

3. **Run E2E tests**:
   ```bash
   npm run test:e2e
   ```

## Directory Structure

```
e2e/
├── fixtures/              # Test setup and helpers
│   ├── auth.setup.ts     # Authentication setup script
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

- **auth.setup.ts**: Sets up authenticated user session
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
2. Use authenticated state: `test.use({ storageState: 'e2e/.auth/user.json' })`
3. Import helpers from `../fixtures/test-helpers`
4. Follow existing test patterns

Example:
```typescript
import { test, expect } from '@playwright/test';

test.describe('New Page', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('should display page content', async ({ page }) => {
    await page.goto('/new-page');
    await expect(page.locator('text=Expected Content')).toBeVisible();
  });
});
```

## Troubleshooting

### Tests Fail with "Not Authenticated"
Run the auth setup script:
```bash
npx playwright test e2e/fixtures/auth.setup.ts
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

1. Use authenticated state for protected pages
2. Wait for API responses before asserting
3. Use data-testid attributes when possible
4. Keep tests independent and isolated
5. Test complete user flows, not just individual actions

