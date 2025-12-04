// Polyfill Web APIs FIRST - before any Next.js imports
// These must be available before Next.js modules are loaded
if (typeof global.Response === 'undefined') {
  const { Response: NodeResponse, Request, Headers } = require('node-fetch');
  
  // Extend Response to add json static method that Next.js expects
  class ResponseWithJson extends NodeResponse {
    static json(data, init = {}) {
      const body = JSON.stringify(data);
      const headers = new Headers(init.headers);
      headers.set('Content-Type', 'application/json');
      return new ResponseWithJson(body, {
        ...init,
        headers,
      });
    }
  }
  
  global.Response = ResponseWithJson;
  global.Request = Request;
  global.Headers = Headers;
}

// Polyfill fetch API for Node.js
if (typeof global.fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      refresh: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  useParams() {
    return {}
  },
}))

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}))

// Mock NextResponse to work with our polyfilled Response
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
    NextRequest: actual.NextRequest,
    NextResponse: MockNextResponse,
  };
});

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key'
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-crm'
