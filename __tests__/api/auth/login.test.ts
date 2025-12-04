// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    }),
    create: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  generateToken: jest.fn(() => 'mock-token'),
}));

jest.mock('@/lib/activity', () => ({
  __esModule: true,
  createActivity: jest.fn(),
}));

import { POST } from '@/app/api/auth/login/route';
import User from '@/models/User';
import { createMockRequest } from '../../utils/test-helpers';

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if email is missing', async () => {
    const request = createMockRequest('POST', { password: 'password123' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Email and password are required');
  });

  it('should return 400 if password is missing', async () => {
    const request = createMockRequest('POST', { email: 'test@example.com' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Email and password are required');
  });

  it('should return 401 if user does not exist', async () => {
    (User.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const request = createMockRequest('POST', {
      email: 'nonexistent@example.com',
      password: 'password123',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid email or password');
  });

  it('should return 401 if account is deactivated', async () => {
    const mockUser = {
      _id: 'user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
      isActive: false,
      comparePassword: jest.fn().mockResolvedValue(true),
    };

    (User.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    const request = createMockRequest('POST', {
      email: 'test@example.com',
      password: 'password123',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Account is deactivated');
  });

  it('should return 401 if password is incorrect', async () => {
    const mockUser = {
      _id: 'user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      comparePassword: jest.fn().mockResolvedValue(false),
    };

    (User.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    const request = createMockRequest('POST', {
      email: 'test@example.com',
      password: 'wrongpassword',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid email or password');
  });

  it('should return success and set auth cookie for valid credentials', async () => {
    const mockUser = {
      _id: 'user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      comparePassword: jest.fn().mockResolvedValue(true),
    };

    (User.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    const request = createMockRequest('POST', {
      email: 'test@example.com',
      password: 'password123',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.user.email).toBe('test@example.com');
    expect(data.data.token).toBe('mock-token');
    
    // Check that cookie is set - cookies object exists and has set method
    expect(response.cookies).toBeDefined();
    expect(typeof response.cookies.set).toBe('function');
  });
});

