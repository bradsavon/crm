// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
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

import { GET, PUT, DELETE } from '@/app/api/users/[id]/route';
import User from '@/models/User';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { createMockRequest, createMockUser } from '../../utils/test-helpers';

describe('GET /api/users/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'user-id' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return user data for own profile', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const mockUser = {
      _id: 'user-id',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
    };

    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'user-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.email).toBe('test@example.com');
  });

  it('should return 403 if user lacks permission to view other user', async () => {
    const user = createMockUser({ id: 'user-id', role: 'salesrep' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'other-user-id' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Insufficient permissions');
  });

  it('should allow manager to view other user', async () => {
    const manager = createMockUser({ id: 'manager-id', role: 'manager' });
    (getCurrentUser as jest.Mock).mockResolvedValue(manager);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const mockUser = {
      _id: 'other-user-id',
      firstName: 'Other',
      lastName: 'User',
      email: 'other@example.com',
    };

    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'other-user-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.email).toBe('other@example.com');
  });

  it('should return 404 if user not found', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'non-existent-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('User not found');
  });

  it('should handle errors during get', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error('Database error')),
    });

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'user-id' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});

describe('PUT /api/users/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow user to update own profile (limited fields)', async () => {
    const user = createMockUser({ id: 'user-id', role: 'salesrep' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const updatedUser = {
      _id: 'user-id',
      firstName: 'Updated',
      lastName: 'Name',
      email: 'test@example.com',
    };

    (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(updatedUser),
    });

    const request = createMockRequest('PUT', { firstName: 'Updated', lastName: 'Name' });
    const response = await PUT(request, { params: { id: 'user-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.firstName).toBe('Updated');
  });

  it('should return 403 if non-admin tries to update other user', async () => {
    const user = createMockUser({ id: 'user-id', role: 'manager' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const request = createMockRequest('PUT', { firstName: 'Updated' });
    const response = await PUT(request, { params: { id: 'other-user-id' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Only admins can update other users');
  });

  it('should allow admin to update other user', async () => {
    const admin = createMockUser({ id: 'admin-id', role: 'admin' });
    (getCurrentUser as jest.Mock).mockResolvedValue(admin);

    const updatedUser = {
      _id: 'other-user-id',
      firstName: 'Updated',
      lastName: 'Name',
      email: 'other@example.com',
      role: 'salesrep',
    };

    (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(updatedUser),
    });

    const request = createMockRequest('PUT', { firstName: 'Updated', role: 'salesrep' });
    const response = await PUT(request, { params: { id: 'other-user-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.firstName).toBe('Updated');
  });

  it('should filter disallowed fields when non-admin updates own profile', async () => {
    const user = createMockUser({ id: 'user-id', role: 'salesrep' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const updatedUser = {
      _id: 'user-id',
      firstName: 'Updated',
      lastName: 'Name',
      email: 'test@example.com',
      role: 'salesrep', // Should not be updated
    };

    (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(updatedUser),
    });

    const request = createMockRequest('PUT', { 
      firstName: 'Updated', 
      lastName: 'Name',
      role: 'admin', // Should be filtered out
      email: 'new@example.com', // Should be filtered out
    });
    const response = await PUT(request, { params: { id: 'user-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Verify only allowed fields were passed
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'user-id',
      { firstName: 'Updated', lastName: 'Name' },
      expect.any(Object)
    );
  });

  it('should remove password field from update', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const updatedUser = {
      _id: 'user-id',
      firstName: 'Updated',
      lastName: 'Name',
    };

    (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(updatedUser),
    });

    const request = createMockRequest('PUT', { 
      firstName: 'Updated',
      password: 'newpassword', // Should be removed
    });
    const response = await PUT(request, { params: { id: 'user-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'user-id',
      { firstName: 'Updated' },
      expect.any(Object)
    );
  });

  it('should return 404 if user not found for update', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const request = createMockRequest('PUT', { firstName: 'Updated' });
    const response = await PUT(request, { params: { id: 'non-existent-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('User not found');
  });

  it('should handle errors during update', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error('Database error')),
    });

    const request = createMockRequest('PUT', { firstName: 'Updated' });
    const response = await PUT(request, { params: { id: 'user-id' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});

describe('DELETE /api/users/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 403 if user is not admin', async () => {
    const user = createMockUser({ id: 'user-id', role: 'manager' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'other-user-id' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Only admins can delete users');
  });

  it('should prevent self-deletion', async () => {
    const admin = createMockUser({ id: 'admin-id', role: 'admin' });
    (getCurrentUser as jest.Mock).mockResolvedValue(admin);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'admin-id' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Cannot delete your own account');
  });

  it('should delete user successfully for admin', async () => {
    const admin = createMockUser({ id: 'admin-id', role: 'admin' });
    (getCurrentUser as jest.Mock).mockResolvedValue(admin);

    const mockUser = {
      _id: 'user-id',
      firstName: 'Test',
      lastName: 'User',
    };

    (User.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUser);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'user-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('User deleted successfully');
  });

  it('should return 404 if user not found for delete', async () => {
    const admin = createMockUser({ id: 'admin-id', role: 'admin' });
    (getCurrentUser as jest.Mock).mockResolvedValue(admin);
    (User.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'non-existent-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('User not found');
  });

  it('should handle errors during delete', async () => {
    const admin = createMockUser({ id: 'admin-id', role: 'admin' });
    (getCurrentUser as jest.Mock).mockResolvedValue(admin);
    (User.findByIdAndDelete as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'user-id' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});

