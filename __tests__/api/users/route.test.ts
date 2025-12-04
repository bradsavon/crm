// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  getCurrentUser: jest.fn(),
  hasPermission: jest.fn(),
}));

jest.mock('@/lib/activity', () => ({
  __esModule: true,
  createActivity: jest.fn(),
}));

import { GET, POST } from '@/app/api/users/route';
import User from '@/models/User';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { createMockRequest, createMockUser } from '../../utils/test-helpers';

describe('GET /api/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return 403 if user is not manager or admin', async () => {
    const salesRep = createMockUser({ role: 'salesrep' });
    (getCurrentUser as jest.Mock).mockResolvedValue(salesRep);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Insufficient permissions');
  });

  it('should return all users for manager/admin', async () => {
    const manager = createMockUser({ role: 'manager' });
    (getCurrentUser as jest.Mock).mockResolvedValue(manager);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const mockUsers = [
      { _id: '1', firstName: 'User', lastName: 'One', email: 'user1@example.com' },
      { _id: '2', firstName: 'User', lastName: 'Two', email: 'user2@example.com' },
    ];

    (User.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockUsers),
      }),
    });

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
  });
});

describe('POST /api/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('POST', {
      firstName: 'New',
      lastName: 'User',
      email: 'new@example.com',
      password: 'password123',
      role: 'salesrep',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return 403 if user is not admin', async () => {
    const manager = createMockUser({ role: 'manager' });
    (getCurrentUser as jest.Mock).mockResolvedValue(manager);

    const request = createMockRequest('POST', {
      firstName: 'New',
      lastName: 'User',
      email: 'new@example.com',
      password: 'password123',
      role: 'salesrep',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Only admins can create users');
  });

  it('should create user successfully for admin', async () => {
    const admin = createMockUser({ role: 'admin' });
    (getCurrentUser as jest.Mock).mockResolvedValue(admin);

    const userData = {
      firstName: 'New',
      lastName: 'User',
      email: 'new@example.com',
      password: 'password123',
      role: 'salesrep',
    };

    const mockUser = {
      _id: 'new-user-id',
      ...userData,
      toObject: jest.fn(() => ({
        _id: 'new-user-id',
        ...userData,
        password: 'hashed-password',
      })),
    };

    (User.findOne as jest.Mock).mockResolvedValue(null);
    (User.create as jest.Mock).mockResolvedValue(mockUser);

    const request = createMockRequest('POST', userData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.email).toBe('new@example.com');
    expect(User.create).toHaveBeenCalledWith(userData);
  });

  it('should return 400 if user already exists', async () => {
    const admin = createMockUser({ role: 'admin' });
    (getCurrentUser as jest.Mock).mockResolvedValue(admin);

    const userData = {
      firstName: 'New',
      lastName: 'User',
      email: 'existing@example.com',
      password: 'password123',
      role: 'salesrep',
    };

    (User.findOne as jest.Mock).mockResolvedValue({ _id: 'existing-id' });

    const request = createMockRequest('POST', userData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('User with this email already exists');
  });
});

