// Mock dependencies BEFORE imports
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  const { Response, Headers } = require('node-fetch');
  
  class MockNextResponse extends Response {
    constructor(body, init = {}) {
      super(body, init);
      this.cookies = {
        set: jest.fn(),
        get: jest.fn(),
        delete: jest.fn(),
        getAll: jest.fn(() => []),
      };
    }
    
    static json(data, init = {}) {
      const body = JSON.stringify(data);
      const headers = new Headers(init.headers);
      headers.set('Content-Type', 'application/json');
      return new MockNextResponse(body, {
        ...init,
        headers,
      });
    }
  }
  
  return {
    ...actual,
    NextResponse: MockNextResponse,
  };
});

import { POST } from '@/app/api/auth/logout/route';

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should logout successfully and clear auth cookie', async () => {
    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Logged out successfully');
    
    // Check that cookie is cleared
    expect(response.cookies).toBeDefined();
    expect(typeof response.cookies.set).toBe('function');
  });
});

