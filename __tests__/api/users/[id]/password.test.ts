// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  getCurrentUser: jest.fn(),
}));

jest.mock('@/lib/activity', () => ({
  __esModule: true,
  createActivity: jest.fn(),
}));

import { PUT } from '@/app/api/users/[id]/password/route';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';
import { createMockRequest, createMockUser } from '../../../utils/test-helpers';

describe('PUT /api/users/[id]/password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('PUT', {
      currentPassword: 'oldpass',
      newPassword: 'newpass123',
    });
    const response = await PUT(request, { params: { id: 'user-id' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return 403 if user tries to change another user password', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const request = createMockRequest('PUT', {
      currentPassword: 'oldpass',
      newPassword: 'newpass123',
    });
    const response = await PUT(request, { params: { id: 'other-user-id' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('You can only change your own password');
  });

  it('should return 400 if passwords are missing', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const request = createMockRequest('PUT', {});
    const response = await PUT(request, { params: { id: 'user-id' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('required');
  });

  it('should return 400 if new password is too short', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const request = createMockRequest('PUT', {
      currentPassword: 'oldpass',
      newPassword: 'short',
    });
    const response = await PUT(request, { params: { id: 'user-id' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('at least 6 characters');
  });

  it('should return 400 if current password is incorrect', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const mockUser = {
      _id: 'user-id',
      password: 'hashed-password',
      comparePassword: jest.fn().mockResolvedValue(false),
      save: jest.fn().mockResolvedValue(true),
    };

    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    const request = createMockRequest('PUT', {
      currentPassword: 'wrongpass',
      newPassword: 'newpass123',
    });
    const response = await PUT(request, { params: { id: 'user-id' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Current password is incorrect');
  });

  it('should change password successfully', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const mockUser = {
      _id: 'user-id',
      password: 'hashed-password',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true),
    };

    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    const request = createMockRequest('PUT', {
      currentPassword: 'oldpass',
      newPassword: 'newpass123',
    });
    const response = await PUT(request, { params: { id: 'user-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Password changed successfully');
    expect(mockUser.save).toHaveBeenCalled();
  });
});

