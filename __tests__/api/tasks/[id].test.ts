// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/Task', () => ({
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

import { GET, PUT, DELETE } from '@/app/api/tasks/[id]/route';
import Task from '@/models/Task';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { createMockRequest, createMockUser } from '../../utils/test-helpers';

describe('GET /api/tasks/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'task-id' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return task for assigned user', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const mockTask = {
      _id: 'task-id',
      title: 'Test Task',
      assignedTo: { _id: 'user-id' },
      toObject: jest.fn(() => ({
        _id: 'task-id',
        assignedTo: { _id: 'user-id' },
      })),
    };

    (Task.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockTask),
      }),
    });

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'task-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('Test Task');
  });

  it('should return 403 if user lacks permission', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const mockTask = {
      _id: 'task-id',
      title: 'Test Task',
      assignedTo: { _id: 'other-user-id' },
      toObject: jest.fn(() => ({
        _id: 'task-id',
        assignedTo: { _id: 'other-user-id' },
      })),
    };

    (Task.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockTask),
      }),
    });

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'task-id' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Insufficient permissions');
  });
});

describe('PUT /api/tasks/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('PUT', { title: 'Updated Task' });
    const response = await PUT(request, { params: { id: 'task-id' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return 404 if task not found', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    (Task.findById as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('PUT', { title: 'Updated Task' });
    const response = await PUT(request, { params: { id: 'non-existent-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Task not found');
  });

  it('should return 403 if user lacks permission to update', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const existingTask = {
      _id: 'task-id',
      title: 'Old Task',
      assignedTo: 'other-user-id',
      createdBy: 'other-user-id',
      toObject: jest.fn(() => ({
        _id: 'task-id',
        assignedTo: 'other-user-id',
        createdBy: 'other-user-id',
      })),
    };

    (Task.findById as jest.Mock).mockResolvedValue(existingTask);

    const request = createMockRequest('PUT', { title: 'Updated Task' });
    const response = await PUT(request, { params: { id: 'task-id' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Insufficient permissions');
  });

  it('should update task successfully', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const existingTask = {
      _id: 'task-id',
      title: 'Old Task',
      assignedTo: 'user-id',
      status: 'pending',
      toObject: jest.fn(() => ({
        _id: 'task-id',
        assignedTo: 'user-id',
        createdBy: 'user-id',
      })),
    };

    const updatedTask = {
      _id: 'task-id',
      title: 'Updated Task',
      assignedTo: 'user-id',
      status: 'in-progress',
    };

    (Task.findById as jest.Mock).mockResolvedValue(existingTask);
    (Task.findByIdAndUpdate as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedTask),
      }),
    });

    const request = createMockRequest('PUT', { title: 'Updated Task', status: 'in-progress' });
    const response = await PUT(request, { params: { id: 'task-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('Updated Task');
  });

  it('should log assigned activity when task is reassigned', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const existingTask = {
      _id: 'task-id',
      title: 'Old Task',
      assignedTo: 'old-user-id',
      status: 'pending',
      toObject: jest.fn(() => ({
        _id: 'task-id',
        assignedTo: 'old-user-id',
        createdBy: 'user-id',
      })),
    };

    const updatedTask = {
      _id: 'task-id',
      title: 'Updated Task',
      assignedTo: 'new-user-id',
      status: 'pending',
    };

    (Task.findById as jest.Mock).mockResolvedValue(existingTask);
    (Task.findByIdAndUpdate as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedTask),
      }),
    });

    const { createActivity } = require('@/lib/activity');

    const request = createMockRequest('PUT', { assignedTo: 'new-user-id' });
    const response = await PUT(request, { params: { id: 'task-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(createActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'assigned',
        description: expect.stringContaining('Assigned task'),
      })
    );
  });

  it('should log completed activity when task status changes to completed', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const existingTask = {
      _id: 'task-id',
      title: 'Old Task',
      assignedTo: 'user-id',
      status: 'pending',
      toObject: jest.fn(() => ({
        _id: 'task-id',
        assignedTo: 'user-id',
        createdBy: 'user-id',
      })),
    };

    const updatedTask = {
      _id: 'task-id',
      title: 'Updated Task',
      assignedTo: 'user-id',
      status: 'completed',
    };

    (Task.findById as jest.Mock).mockResolvedValue(existingTask);
    (Task.findByIdAndUpdate as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedTask),
      }),
    });

    const { createActivity } = require('@/lib/activity');

    const request = createMockRequest('PUT', { status: 'completed' });
    const response = await PUT(request, { params: { id: 'task-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(createActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining('Completed task'),
      })
    );
  });

  it('should handle database errors', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    (Task.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('PUT', { title: 'Updated Task' });
    const response = await PUT(request, { params: { id: 'task-id' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});

describe('DELETE /api/tasks/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'task-id' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return 404 if task not found', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    (Task.findById as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'non-existent-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Task not found');
  });

  it('should return 403 if user lacks permission to delete', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const mockTask = {
      _id: 'task-id',
      title: 'Test Task',
      assignedTo: 'user-id',
      toObject: jest.fn(() => ({
        _id: 'task-id',
        createdBy: 'other-user-id',
      })),
    };

    (Task.findById as jest.Mock).mockResolvedValue(mockTask);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'task-id' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Insufficient permissions');
  });

  it('should delete task successfully', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const mockTask = {
      _id: 'task-id',
      title: 'Test Task',
      assignedTo: 'user-id',
      toObject: jest.fn(() => ({
        _id: 'task-id',
        createdBy: 'user-id',
      })),
    };

    (Task.findById as jest.Mock).mockResolvedValue(mockTask);
    (Task.findByIdAndDelete as jest.Mock).mockResolvedValue(mockTask);

    const { createActivity } = require('@/lib/activity');

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'task-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Task.findByIdAndDelete).toHaveBeenCalledWith('task-id');
    expect(createActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'deleted',
        description: expect.stringContaining('Deleted task'),
      })
    );
  });

  it('should handle database errors', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    (Task.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'task-id' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});

