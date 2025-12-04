# Testing Documentation

## Overview

This document describes the testing approach, tools, and best practices for the CRM Next.js application. The project uses a comprehensive testing strategy to ensure code quality, reliability, and maintainability.

## Testing Philosophy

Our testing approach follows these principles:

1. **Comprehensive Coverage**: Aim for at least 80% coverage for statements, branches, and functions
2. **Test-Driven Development**: Write tests alongside or before implementation
3. **Isolation**: Each test should be independent and not rely on other tests
4. **Realistic Mocks**: Use mocks that closely simulate real behavior
5. **Clear Assertions**: Tests should clearly express what they're verifying

## Testing Tools and Frameworks

### Core Testing Framework

- **Jest**: JavaScript testing framework with built-in test runner, assertion library, and mocking capabilities
- **React Testing Library**: Simple and complete testing utilities for React components
- **@testing-library/jest-dom**: Custom Jest matchers for DOM elements
- **@testing-library/user-event**: Simulates user interactions

### Configuration Files

- `jest.config.js`: Jest configuration with Next.js support
- `jest.setup.js`: Global test setup, mocks, and polyfills

## Test Structure

### Directory Organization

```
__tests__/
├── api/                    # API route tests
│   ├── auth/              # Authentication endpoints
│   ├── cases/             # Case management endpoints
│   ├── companies/         # Company endpoints
│   ├── contacts/          # Contact endpoints
│   ├── documents/         # Document endpoints
│   ├── meetings/          # Meeting endpoints
│   ├── tasks/             # Task endpoints
│   └── users/             # User management endpoints
├── components/            # React component tests
├── lib/                   # Utility function tests
├── models/                # Mongoose model tests
└── utils/                 # Test helper utilities
    └── test-helpers.ts    # Shared test utilities
```

### Naming Conventions

- Test files: `*.test.ts` or `*.test.tsx`
- Test suites: Use descriptive `describe` blocks
- Test cases: Use clear `it` or `test` statements that describe the expected behavior

Example:
```typescript
describe('GET /api/contacts/[id]', () => {
  it('should return contact by id', async () => {
    // test implementation
  });
});
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run a specific test file
npm test -- __tests__/components/Navigation.test.tsx

# Run tests matching a pattern
npm test -- Navigation
```

### Coverage Reports

Coverage reports are generated in the `coverage/` directory. The project aims for:
- **Statements**: ≥ 80%
- **Branches**: ≥ 80%
- **Functions**: ≥ 80%
- **Lines**: ≥ 80%

View coverage report:
```bash
npm run test:coverage
# Open coverage/lcov-report/index.html in a browser
```

## Testing API Routes

### Setup and Mocking

API route tests use the following mocking strategy:

1. **MongoDB Connection**: Mocked to avoid actual database connections
2. **Mongoose Models**: Mocked with Jest to control behavior
3. **Authentication**: Mock `getCurrentUser` and `hasPermission` functions
4. **Next.js APIs**: Mock `NextRequest`, `NextResponse`, and `cookies`

### Example API Route Test

```typescript
// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/Contact', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

import { GET, PUT, DELETE } from '@/app/api/contacts/[id]/route';
import Contact from '@/models/Contact';
import { createMockRequest } from '../../utils/test-helpers';

describe('GET /api/contacts/[id]', () => {
  it('should return contact by id', async () => {
    const mockContact = {
      _id: 'contact-id',
      firstName: 'John',
      lastName: 'Doe',
    };

    (Contact.findById as jest.Mock).mockResolvedValue(mockContact);

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'contact-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.firstName).toBe('John');
  });
});
```

### Testing Patterns

1. **Happy Path**: Test successful operations
2. **Error Handling**: Test error cases (404, 400, 401, 403)
3. **Validation**: Test input validation
4. **Permissions**: Test role-based access control
5. **Edge Cases**: Test boundary conditions

## Testing React Components

### Setup

Component tests use React Testing Library with the following setup:

```typescript
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Component from '@/components/Component';

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));
```

### Component Testing Patterns

1. **Rendering**: Test that components render correctly
2. **User Interactions**: Test clicks, form submissions, etc.
3. **State Changes**: Test component state updates
4. **Props**: Test component behavior with different props
5. **Async Operations**: Use `waitFor` for async updates

### Example Component Test

```typescript
describe('Navigation Component', () => {
  it('should render navigation items', () => {
    render(<Navigation />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Contacts')).toBeInTheDocument();
  });

  it('should handle search submission', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(<Navigation />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    fireEvent.submit(searchInput.closest('form')!);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/search?q=test%20query');
    });
  });
});
```

### Handling Async Operations

When testing async operations, use `waitFor` and `act`:

```typescript
it('should load data asynchronously', async () => {
  render(<Component />);

  await waitFor(() => {
    expect(screen.getByText('Loaded Data')).toBeInTheDocument();
  });
});

it('should handle state updates', async () => {
  render(<Component />);

  await act(async () => {
    fireEvent.click(screen.getByRole('button'));
  });

  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

## Testing Utilities

### Test Helpers

The `__tests__/utils/test-helpers.ts` file provides reusable utilities:

- `createMockRequest()`: Creates a mock `NextRequest` for API route tests
- `createMockUser()`: Creates a mock user object
- `createMockAuthCookie()`: Creates a mock authentication cookie

### Example Usage

```typescript
import { createMockRequest, createMockUser } from '../utils/test-helpers';

const request = createMockRequest('POST', { name: 'Test' });
const user = createMockUser({ role: 'admin' });
```

## Mocking Strategies

### Next.js APIs

```typescript
// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}));
```

### Mongoose Models

```typescript
jest.mock('@/models/Contact', () => ({
  __esModule: true,
  default: {
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      }),
    }),
    findById: jest.fn(),
    create: jest.fn(),
  },
}));
```

### Fetch API

```typescript
global.fetch = jest.fn();

(global.fetch as jest.Mock).mockResolvedValue({
  ok: true,
  json: async () => ({ success: true, data: {} }),
});
```

## Coverage Requirements

### Minimum Coverage Thresholds

- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Files Excluded from Coverage

- Next.js page components (`app/**/page.tsx`) - Tested via E2E
- Configuration files
- Type definitions

### Checking Coverage

```bash
# Generate coverage report
npm run test:coverage

# Check specific file coverage
npm test -- --coverage --collectCoverageFrom='app/api/contacts/route.ts'
```

## Best Practices

### 1. Test Organization

- Group related tests in `describe` blocks
- Use descriptive test names that explain what is being tested
- Follow the Arrange-Act-Assert pattern

### 2. Test Independence

- Each test should be able to run independently
- Use `beforeEach` to set up fresh state
- Clean up mocks with `jest.clearAllMocks()`

### 3. Mock Management

- Mock at the module level, not inside tests
- Use realistic mock data
- Reset mocks between tests

### 4. Async Testing

- Always use `await` for async operations
- Use `waitFor` for DOM updates
- Wrap state updates in `act()` when needed

### 5. Assertions

- Use specific matchers (`toBe`, `toEqual`, `toContain`)
- Test both positive and negative cases
- Verify error messages and status codes

### 6. Test Data

- Use factories or helpers for creating test data
- Keep test data minimal and focused
- Use meaningful values that reflect real usage

## Common Patterns

### Testing Error Handling

```typescript
it('should handle errors gracefully', async () => {
  (Model.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

  const request = createMockRequest('GET');
  const response = await GET(request, { params: { id: 'id' } });
  const data = await response.json();

  expect(response.status).toBe(400);
  expect(data.success).toBe(false);
  expect(data.error).toBe('Database error');
});
```

### Testing Permissions

```typescript
it('should return 403 for unauthorized access', async () => {
  const user = createMockUser({ role: 'salesrep' });
  (getCurrentUser as jest.Mock).mockResolvedValue(user);
  (hasPermission as jest.Mock).mockReturnValue(false);

  const request = createMockRequest('GET');
  const response = await GET(request, { params: { id: 'id' } });
  const data = await response.json();

  expect(response.status).toBe(403);
  expect(data.error).toBe('Insufficient permissions');
});
```

### Testing Form Submissions

```typescript
it('should submit form with valid data', async () => {
  render(<FormComponent />);

  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'Test Name' },
  });
  fireEvent.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalledWith({ name: 'Test Name' });
  });
});
```

## Continuous Integration

Tests are automatically run in CI/CD pipelines. Ensure:

1. All tests pass before merging
2. Coverage thresholds are met
3. No console errors or warnings in tests
4. Tests complete in reasonable time

## Troubleshooting

### Common Issues

1. **"An update was not wrapped in act(...)"**
   - Wrap state updates in `act()` calls
   - Use `waitFor` for async updates

2. **"Cannot find module"**
   - Check module path aliases in `jest.config.js`
   - Verify imports use `@/` prefix

3. **"Mock function not called"**
   - Ensure mocks are set up before imports
   - Check that mocks are reset between tests

4. **"Timeout errors"**
   - Increase timeout for slow operations
   - Use `waitFor` with custom timeout

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## End-to-End (E2E) Testing

### Overview

E2E tests use Playwright to test the full application flow, including Next.js page components (`app/**/page.tsx`). These tests run in a real browser environment and test the complete user journey.

### Tools

- **Playwright**: Modern, fast, and reliable E2E testing framework
- Supports multiple browsers (Chromium, Firefox, WebKit)
- Built-in waiting and auto-retry mechanisms
- Screenshot and video recording on failures

### Setup

E2E tests are located in the `e2e/` directory:

```
e2e/
├── auth.setup.ts          # Authentication setup script
├── fixtures/              # Test helpers
│   └── test-helpers.ts    # Reusable helper functions
└── pages/                 # Page component tests
    ├── login.spec.ts      # Login page tests
    ├── dashboard.spec.ts  # Dashboard page tests
    ├── contacts.spec.ts   # Contacts page tests
    ├── tasks.spec.ts       # Tasks page tests
    └── navigation.spec.ts # Navigation tests
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode (interactive)
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Configuration

E2E tests are configured in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000` (or `BASE_URL` env variable)
- **Test Directory**: `./e2e`
- **Browsers**: Chromium (default), Firefox, WebKit
- **Auto-start**: Dev server starts automatically before tests
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: Captured on failure
- **Traces**: Collected on first retry

### Authentication Setup

E2E tests use authenticated sessions stored in `.auth/user.json`. The setup script (`e2e/auth.setup.ts`) logs in once and saves the session for reuse. The setup project in `playwright.config.ts` automatically runs this before other tests.

**Environment Variables:**
- `TEST_USER_EMAIL`: Test user email (default: `admin@crm.com`)
- `TEST_USER_PASSWORD`: Test user password (default: `admin123`)

### Writing E2E Tests

#### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Page Name', () => {
  // Use authenticated state (automatically set by setup project)
  test.use({ storageState: '.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/page-path');
  });

  test('should display page content', async ({ page }) => {
    await expect(page.locator('text=Expected Content')).toBeVisible();
  });
});
```

#### Using Test Helpers

```typescript
import { loginUser, navigateToPage } from '../fixtures/test-helpers';

test('should login and navigate', async ({ page }) => {
  await loginUser(page, 'user@example.com', 'password');
  await navigateToPage(page, '/contacts');
  await expect(page).toHaveURL('/contacts');
});
```

**Note**: Most tests use the authenticated state from the setup project, so manual login is typically not needed.

#### Waiting for API Responses

```typescript
test('should load data from API', async ({ page }) => {
  // Wait for API call to complete
  await page.waitForResponse((response) => 
    response.url().includes('/api/contacts') && response.status() === 200
  );

  // Then check for rendered content
  await expect(page.locator('table')).toBeVisible();
});
```

### E2E Testing Patterns

#### 1. Page Navigation

```typescript
test('should navigate to page', async ({ page }) => {
  await page.click('text=Contacts');
  await expect(page).toHaveURL('/contacts');
});
```

#### 2. Form Submission

```typescript
test('should submit form', async ({ page }) => {
  await page.fill('input[name="name"]', 'Test Name');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  
  // Wait for redirect or success message
  await page.waitForURL('/success-page', { timeout: 10000 });
});
```

#### 3. Authentication Flow

```typescript
test('should require authentication', async ({ page }) => {
  // Try to access protected page without auth
  await page.goto('/contacts');
  
  // Should redirect to login
  await expect(page).toHaveURL('/login');
});
```

#### 4. Responsive Design

```typescript
test('should be responsive on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  
  // Check mobile-specific elements
  const menuButton = page.locator('button[aria-label="Menu"]');
  await expect(menuButton).toBeVisible();
});
```

#### 5. Error Handling

```typescript
test('should display error messages', async ({ page }) => {
  await page.fill('input[type="email"]', 'invalid@example.com');
  await page.fill('input[type="password"]', 'wrong');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('text=/error|invalid/i')).toBeVisible();
});
```

### Best Practices for E2E Tests

1. **Use Authenticated State**: Reuse authenticated sessions for faster tests
2. **Wait for Network Idle**: Use `waitForLoadState('networkidle')` after navigation
3. **Wait for API Responses**: Wait for API calls before asserting content
4. **Use Data Attributes**: Prefer `data-testid` over CSS selectors when possible
5. **Test User Flows**: Focus on complete user journeys, not just individual pages
6. **Keep Tests Independent**: Each test should be able to run standalone
7. **Use Helpers**: Create reusable helper functions for common operations

### Debugging E2E Tests

1. **UI Mode**: Run `npm run test:e2e:ui` for interactive debugging
2. **Headed Mode**: Run `npm run test:e2e:headed` to see the browser
3. **Debug Mode**: Run `npm run test:e2e:debug` to step through tests
4. **Screenshots**: Automatically captured on failure in `test-results/`
5. **Traces**: Use `playwright show-trace` to view execution traces

### CI/CD Integration

For CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npm run test:e2e
  env:
    BASE_URL: ${{ secrets.BASE_URL }}
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

### Coverage

E2E tests complement unit tests by:
- Testing complete user workflows
- Verifying page rendering and navigation
- Testing form submissions and data flow
- Validating authentication and authorization
- Checking responsive design
- Testing browser compatibility

## Test Statistics

As of the latest commit:
- **Unit Tests**: 298 tests, 29 suites
- **E2E Tests**: Multiple page component test suites covering login, dashboard, contacts, tasks, and navigation
- **Coverage**: Most files above 80% for statements, branches, and functions
- **Status**: 
  - Unit tests: All passing ✅
  - E2E tests: Most passing, with some tests skipped for form submission flows that require additional debugging

### Skipped E2E Tests

The following E2E tests are currently skipped and may be re-enabled after resolving form submission timing issues:
- `New Contact Page > should create a new contact`
- `New Task Page > should create a new task`

These tests are skipped using `test.skip()` and can be re-enabled when the underlying form submission and navigation timing issues are resolved.

---

*Last updated: [Current Date]*

