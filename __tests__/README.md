# Test Suite Documentation

This directory contains comprehensive unit tests for the CRM Next.js application.

## Test Structure

```
__tests__/
├── api/                    # API route tests
│   ├── auth/
│   │   └── login.test.ts
│   ├── contacts.test.ts
│   ├── cases.test.ts
│   ├── tasks.test.ts
│   ├── search.test.ts
│   └── stats.test.ts
├── components/             # Component tests
│   ├── Navigation.test.tsx
│   ├── FileUpload.test.tsx
│   └── DocumentList.test.tsx
├── lib/                    # Utility function tests
│   ├── auth.test.ts
│   └── activity.test.ts
├── models/                 # Model tests
│   └── User.test.ts
└── utils/                  # Test utilities
    └── test-helpers.ts
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

## Test Coverage

### API Routes
- ✅ Authentication (login)
- ✅ Contacts (GET, POST)
- ✅ Cases (GET, POST)
- ✅ Tasks (GET, POST with filtering)
- ✅ Search (global search)
- ✅ Stats (dashboard statistics)

### Components
- ✅ Navigation (search, user menu, logout)
- ✅ FileUpload (file selection, drag-and-drop, metadata)
- ✅ DocumentList (loading, display, delete)

### Utilities
- ✅ Auth utilities (token generation, verification, permissions)
- ✅ Activity logging (create, fetch with filters)

### Models
- ✅ User model (password hashing, validation)

## Test Utilities

### `test-helpers.ts`
Provides helper functions for creating mock requests and users:
- `createMockRequest()` - Creates a mock NextRequest
- `createMockUser()` - Creates a mock AuthUser
- `createMockAuthCookie()` - Creates a mock auth cookie

## Mocking Strategy

### Database
- All database operations are mocked using Jest
- Mongoose models are mocked to return predictable data
- No actual database connections in tests

### Next.js
- Router hooks (`useRouter`, `usePathname`, `useSearchParams`) are mocked
- Cookie handling is mocked
- Server components are tested in isolation

### External Dependencies
- `fetch` API is mocked for component tests
- File operations are mocked
- Authentication tokens are mocked

## Writing New Tests

### API Route Test Template
```typescript
import { GET, POST } from '@/app/api/route';
import { createMockRequest, createMockUser } from '../utils/test-helpers';

jest.mock('@/lib/mongodb');
jest.mock('@/models/Model');

describe('GET /api/route', () => {
  it('should return data', async () => {
    // Setup mocks
    // Make request
    // Assert response
  });
});
```

### Component Test Template
```typescript
import { render, screen } from '@testing-library/react';
import Component from '@/components/Component';

global.fetch = jest.fn();

describe('Component', () => {
  it('should render', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Mocking**: Mock all external dependencies
3. **Assertions**: Test both success and error cases
4. **Coverage**: Aim for high code coverage
5. **Readability**: Use descriptive test names
6. **Setup/Teardown**: Use `beforeEach` and `afterEach` appropriately

## Future Test Additions

- [ ] More API route tests (companies, meetings, documents, users)
- [ ] More component tests (DocumentPreview, calendar components)
- [ ] Integration tests
- [ ] E2E tests with Playwright or Cypress
- [ ] Performance tests
- [ ] Security tests

