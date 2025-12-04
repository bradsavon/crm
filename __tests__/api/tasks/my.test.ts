// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/Task', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  getCurrentUser: jest.fn(),
}));

import { GET } from '@/app/api/tasks/my/route';
import Task from '@/models/Task';
import { getCurrentUser } from '@/lib/auth';
import { createMockRequest, createMockUser } from '../../utils/test-helpers';

describe('GET /api/tasks/my', () => {
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

  it('should return categorized tasks for authenticated user', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const mockTasks = [
      {
        _id: '1',
        title: 'Overdue Task',
        dueDate: yesterday,
        status: 'pending',
        assignedTo: 'user-id',
      },
      {
        _id: '2',
        title: 'Due Today Task',
        dueDate: now,
        status: 'pending',
        assignedTo: 'user-id',
      },
      {
        _id: '3',
        title: 'Due Tomorrow Task',
        dueDate: tomorrow,
        status: 'pending',
        assignedTo: 'user-id',
      },
      {
        _id: '4',
        title: 'No Due Date Task',
        dueDate: null,
        status: 'pending',
        assignedTo: 'user-id',
      },
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
    expect(data.data.all).toHaveLength(4);
    expect(data.data.counts.total).toBe(4);
    expect(data.data.overdue.length).toBeGreaterThanOrEqual(1);
    expect(data.data.dueToday.length).toBeGreaterThanOrEqual(1);
    expect(Task.find).toHaveBeenCalledWith({
      assignedTo: 'user-id',
      status: { $in: ['pending', 'in-progress'] },
    });
  });
});

