// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/Task', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
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

import { GET, POST } from '@/app/api/tasks/route';
import { NextRequest } from 'next/server';
import Task from '@/models/Task';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { createMockRequest, createMockUser } from '../utils/test-helpers';

describe('GET /api/tasks', () => {
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
    expect(data.error).toBe('Not authenticated');
  });

  it('should filter tasks by assignedTo for sales rep', async () => {
    const salesRep = createMockUser({ role: 'salesrep', id: 'salesrep-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(salesRep);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const mockTasks = [
      { _id: '1', title: 'Task 1', assignedTo: 'salesrep-id' },
    ];

    (Task.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockTasks),
        }),
      }),
    });

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Task.find).toHaveBeenCalledWith({ assignedTo: 'salesrep-id' });
  });

  it('should return all tasks for manager', async () => {
    const manager = createMockUser({ role: 'manager' });
    (getCurrentUser as jest.Mock).mockResolvedValue(manager);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const mockTasks = [
      { _id: '1', title: 'Task 1' },
      { _id: '2', title: 'Task 2' },
    ];

    (Task.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockTasks),
        }),
      }),
    });

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Task.find).toHaveBeenCalledWith({});
  });

  it('should filter by status query parameter', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const request = new NextRequest('http://localhost:3000/api/tasks?status=pending');

    const mockTasks = [{ _id: '1', title: 'Task 1', status: 'pending' }];

    (Task.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockTasks),
        }),
      }),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Task.find).toHaveBeenCalledWith({ status: 'pending' });
  });

  it('should filter by assignedTo for manager', async () => {
    const manager = createMockUser({ role: 'manager' });
    (getCurrentUser as jest.Mock).mockResolvedValue(manager);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const request = new NextRequest('http://localhost:3000/api/tasks?assignedTo=user-id');

    const mockTasks = [{ _id: '1', title: 'Task 1' }];

    (Task.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockTasks),
        }),
      }),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Task.find).toHaveBeenCalledWith({ assignedTo: 'user-id' });
  });

  it('should filter by priority query parameter', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const request = new NextRequest('http://localhost:3000/api/tasks?priority=high');

    const mockTasks = [{ _id: '1', title: 'Task 1', priority: 'high' }];

    (Task.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockTasks),
        }),
      }),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Task.find).toHaveBeenCalledWith({ priority: 'high' });
  });

  it('should filter by relatedEntityType and relatedEntityId', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const request = new NextRequest('http://localhost:3000/api/tasks?relatedEntityType=contact&relatedEntityId=contact-id');

    const mockTasks = [{ _id: '1', title: 'Task 1' }];

    (Task.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockTasks),
        }),
      }),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Task.find).toHaveBeenCalledWith({
      relatedEntityType: 'contact',
      relatedEntityId: 'contact-id',
    });
  });

  it('should not filter by relatedEntityType if relatedEntityId is missing', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const request = new NextRequest('http://localhost:3000/api/tasks?relatedEntityType=contact');

    const mockTasks = [{ _id: '1', title: 'Task 1' }];

    (Task.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockTasks),
        }),
      }),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should not include relatedEntityType in query
    expect(Task.find).toHaveBeenCalledWith(expect.not.objectContaining({ relatedEntityType: 'contact' }));
  });

  it('should handle errors during get', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(true);
    (Task.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      }),
    });

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});

describe('POST /api/tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('POST', { title: 'New Task' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should create a task with authenticated user', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const taskData = {
      title: 'New Task',
      description: 'Task description',
      priority: 'high',
      dueDate: '2024-12-31',
    };

    const mockTask = {
      _id: 'task-id',
      ...taskData,
      createdBy: user.id,
      assignedTo: user.id,
    };

    (Task.create as jest.Mock).mockResolvedValue(mockTask);
    (Task.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockTask),
      }),
    });

    const request = createMockRequest('POST', taskData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('New Task');
    expect(Task.create).toHaveBeenCalledWith({
      ...taskData,
      createdBy: user.id,
      assignedTo: user.id,
    });
  });

  it('should create a task with assignedTo provided', async () => {
    const user = createMockUser({ id: 'creator-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const taskData = {
      title: 'New Task',
      assignedTo: 'assignee-id',
    };

    const mockTask = {
      _id: 'task-id',
      ...taskData,
      createdBy: user.id,
      assignedTo: 'assignee-id',
    };

    (Task.create as jest.Mock).mockResolvedValue(mockTask);
    (Task.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockTask),
      }),
    });

    const request = createMockRequest('POST', taskData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(Task.create).toHaveBeenCalledWith({
      ...taskData,
      createdBy: user.id,
      assignedTo: 'assignee-id',
    });
  });

  it('should handle errors during create', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (Task.create as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('POST', { title: 'New Task' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});

