import { NextRequest } from 'next/server';
import { AuthUser } from '@/lib/auth';

export function createMockRequest(
  method: string = 'GET',
  body?: any,
  cookies?: Record<string, string>
): NextRequest {
  const url = 'http://localhost:3000/api/test';
  
  // Create headers
  const headers = new Headers();
  if (body) {
    headers.set('Content-Type', 'application/json');
  }

  // Create request with proper structure
  const requestInit: RequestInit = {
    method,
    headers,
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
  }

  // Create NextRequest - it extends Request, so we use the proper constructor
  const request = new NextRequest(url, requestInit);

  // Set cookies if provided
  if (cookies) {
    Object.entries(cookies).forEach(([key, value]) => {
      request.cookies.set(key, value);
    });
  }

  return request;
}

export function createMockUser(overrides?: Partial<AuthUser>): AuthUser {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'admin',
    firstName: 'Test',
    lastName: 'User',
    ...overrides,
  };
}

export function createMockAuthCookie(user: AuthUser): string {
  // In real implementation, this would use JWT
  // For testing, we'll use a simple mock token
  return `mock-token-${user.id}`;
}
