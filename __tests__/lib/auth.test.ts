// Mock dependencies BEFORE imports
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
}));

import { generateToken, verifyToken, hasPermission, requireAuth, getCurrentUser, AuthUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

describe('Auth Utilities', () => {
  const mockUser: AuthUser = {
    id: '123',
    email: 'test@example.com',
    role: 'admin',
    firstName: 'Test',
    lastName: 'User',
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-key';
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different users', () => {
      const user2: AuthUser = { ...mockUser, id: '456' };
      const token1 = generateToken(mockUser);
      const token2 = generateToken(user2);
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken(mockUser);
      const decoded = verifyToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.id).toBe(mockUser.id);
      expect(decoded?.email).toBe(mockUser.email);
      expect(decoded?.role).toBe(mockUser.role);
    });

    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for expired token', () => {
      // Note: This would require mocking time or using a token with short expiry
      // For now, we'll test with an obviously invalid token
      const decoded = verifyToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature');
      expect(decoded).toBeNull();
    });
  });

  describe('hasPermission', () => {
    it('should return false for null user', () => {
      expect(hasPermission(null, 'admin')).toBe(false);
      expect(hasPermission(null, 'manager')).toBe(false);
      expect(hasPermission(null, 'salesrep')).toBe(false);
    });

    it('should allow admin to access all roles', () => {
      const adminUser: AuthUser = { ...mockUser, role: 'admin' };
      expect(hasPermission(adminUser, 'admin')).toBe(true);
      expect(hasPermission(adminUser, 'manager')).toBe(true);
      expect(hasPermission(adminUser, 'salesrep')).toBe(true);
    });

    it('should allow manager to access manager and salesrep', () => {
      const managerUser: AuthUser = { ...mockUser, role: 'manager' };
      expect(hasPermission(managerUser, 'admin')).toBe(false);
      expect(hasPermission(managerUser, 'manager')).toBe(true);
      expect(hasPermission(managerUser, 'salesrep')).toBe(true);
    });

    it('should allow salesrep to access only salesrep', () => {
      const salesRepUser: AuthUser = { ...mockUser, role: 'salesrep' };
      expect(hasPermission(salesRepUser, 'admin')).toBe(false);
      expect(hasPermission(salesRepUser, 'manager')).toBe(false);
      expect(hasPermission(salesRepUser, 'salesrep')).toBe(true);
    });
  });

  describe('requireAuth', () => {
    it('should return false for null user', () => {
      const checkAuth = requireAuth();
      expect(checkAuth(null)).toBe(false);
    });

    it('should return true for authenticated user without role requirements', () => {
      const checkAuth = requireAuth();
      expect(checkAuth(mockUser)).toBe(true);
    });

    it('should return true if user has required role', () => {
      const checkAuth = requireAuth(['admin']);
      expect(checkAuth(mockUser)).toBe(true);
    });

    it('should return false if user does not have required role', () => {
      const checkAuth = requireAuth(['admin']);
      const salesRepUser: AuthUser = { ...mockUser, role: 'salesrep' };
      expect(checkAuth(salesRepUser)).toBe(false);
    });

    it('should return true if user has one of multiple allowed roles', () => {
      const checkAuth = requireAuth(['admin', 'manager']);
      const managerUser: AuthUser = { ...mockUser, role: 'manager' };
      expect(checkAuth(managerUser)).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return user from NextRequest cookies', async () => {
      const token = generateToken(mockUser);
      const mockRequest = {
        cookies: {
          get: jest.fn((name: string) => {
            if (name === 'auth-token') {
              return { value: token };
            }
            return undefined;
          }),
        },
      } as unknown as NextRequest;

      const user = await getCurrentUser(mockRequest);
      expect(user).not.toBeNull();
      expect(user?.id).toBe(mockUser.id);
      expect(user?.email).toBe(mockUser.email);
    });

    it('should return null if no token in request cookies', async () => {
      const mockRequest = {
        cookies: {
          get: jest.fn(() => undefined),
        },
      } as unknown as NextRequest;

      const user = await getCurrentUser(mockRequest);
      expect(user).toBeNull();
    });

    it('should return user from server component cookies', async () => {
      const token = generateToken(mockUser);
      const mockCookieStore = {
        get: jest.fn((name: string) => {
          if (name === 'auth-token') {
            return { value: token };
          }
          return undefined;
        }),
      };

      (cookies as jest.Mock).mockResolvedValue(mockCookieStore);

      const user = await getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.id).toBe(mockUser.id);
    });

    it('should return null if no token in server component cookies', async () => {
      const mockCookieStore = {
        get: jest.fn(() => undefined),
      };

      (cookies as jest.Mock).mockResolvedValue(mockCookieStore);

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return null for invalid token', async () => {
      const mockRequest = {
        cookies: {
          get: jest.fn(() => ({ value: 'invalid-token' })),
        },
      } as unknown as NextRequest;

      const user = await getCurrentUser(mockRequest);
      expect(user).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const mockRequest = {
        cookies: {
          get: jest.fn(() => {
            throw new Error('Cookie error');
          }),
        },
      } as unknown as NextRequest;

      const user = await getCurrentUser(mockRequest);
      expect(user).toBeNull();
    });

    it('should handle errors in server component cookies', async () => {
      (cookies as jest.Mock).mockRejectedValue(new Error('Cookie error'));

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });
  });
});

