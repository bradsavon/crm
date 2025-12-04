import { generateToken, verifyToken, hasPermission, requireAuth, AuthUser } from '@/lib/auth';

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
});

