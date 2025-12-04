// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/Contact', () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn(),
  },
}));

jest.mock('@/models/Company', () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn(),
  },
}));

jest.mock('@/models/Case', () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn(),
    find: jest.fn(),
  },
}));

jest.mock('@/models/Task', () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  getCurrentUser: jest.fn(),
  hasPermission: jest.fn(),
}));

import { GET } from '@/app/api/stats/route';
import { NextRequest } from 'next/server';
import Contact from '@/models/Contact';
import Company from '@/models/Company';
import Case from '@/models/Case';
import Task from '@/models/Task';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { createMockRequest, createMockUser } from '../utils/test-helpers';

describe('GET /api/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return dashboard statistics', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(true);

    (Contact.countDocuments as jest.Mock).mockResolvedValue(10);
    (Company.countDocuments as jest.Mock).mockResolvedValue(5);
    (Case.countDocuments as jest.Mock).mockResolvedValue(8);
    (Case.find as jest.Mock).mockResolvedValue([
      { value: 10000, stage: 'closed-won' },
      { value: 20000, stage: 'closed-won' },
      { value: 15000, stage: 'lead' },
    ]);
    (Task.countDocuments as jest.Mock).mockResolvedValue(15);

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.contacts).toBe(10);
    expect(data.data.companies).toBe(5);
    expect(data.data.cases).toBe(8);
    expect(data.data.totalCaseValue).toBe(45000);
    expect(data.data.wonCaseValue).toBe(30000);
    expect(data.data.openCaseValue).toBe(15000);
  });

  it('should filter tasks by assignedTo for sales rep', async () => {
    const salesRep = createMockUser({ role: 'salesrep', id: 'salesrep-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(salesRep);
    (hasPermission as jest.Mock).mockReturnValue(false);

    (Contact.countDocuments as jest.Mock).mockResolvedValue(5);
    (Company.countDocuments as jest.Mock).mockResolvedValue(3);
    (Case.countDocuments as jest.Mock).mockResolvedValue(4);
    (Case.find as jest.Mock).mockResolvedValue([]);
    (Task.countDocuments as jest.Mock).mockResolvedValue(5);

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Task.countDocuments).toHaveBeenCalledWith({ assignedTo: 'salesrep-id' });
  });

  it('should not filter tasks for manager/admin', async () => {
    const manager = createMockUser({ role: 'manager' });
    (getCurrentUser as jest.Mock).mockResolvedValue(manager);
    (hasPermission as jest.Mock).mockReturnValue(true);

    (Contact.countDocuments as jest.Mock).mockResolvedValue(10);
    (Company.countDocuments as jest.Mock).mockResolvedValue(5);
    (Case.countDocuments as jest.Mock).mockResolvedValue(8);
    (Case.find as jest.Mock).mockResolvedValue([]);
    (Task.countDocuments as jest.Mock).mockResolvedValue(15);

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Task query should be empty for managers
    expect(Task.countDocuments).toHaveBeenCalledWith({});
  });

  it('should handle null currentUser', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    (Contact.countDocuments as jest.Mock).mockResolvedValue(5);
    (Company.countDocuments as jest.Mock).mockResolvedValue(3);
    (Case.countDocuments as jest.Mock).mockResolvedValue(4);
    (Case.find as jest.Mock).mockResolvedValue([]);
    (Task.countDocuments as jest.Mock).mockResolvedValue(5);

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Task query should be empty when no user
    expect(Task.countDocuments).toHaveBeenCalledWith({});
  });

  it('should handle task errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(true);

    (Contact.countDocuments as jest.Mock).mockResolvedValue(10);
    (Company.countDocuments as jest.Mock).mockResolvedValue(5);
    (Case.countDocuments as jest.Mock).mockResolvedValue(8);
    (Case.find as jest.Mock).mockResolvedValue([]);
    (Task.countDocuments as jest.Mock).mockRejectedValue(new Error('Task collection error'));

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.tasks).toBe(0);
    expect(data.data.pendingTasks).toBe(0);
    expect(data.data.overdueTasks).toBe(0);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should calculate case values correctly with missing values', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(true);

    (Contact.countDocuments as jest.Mock).mockResolvedValue(10);
    (Company.countDocuments as jest.Mock).mockResolvedValue(5);
    (Case.countDocuments as jest.Mock).mockResolvedValue(5);
    (Case.find as jest.Mock).mockResolvedValue([
      { value: 10000, stage: 'closed-won' },
      { value: undefined, stage: 'closed-won' }, // Missing value
      { value: 0, stage: 'lead' }, // Zero value
      { value: null, stage: 'closed-lost' }, // Null value
      { value: 5000, stage: 'proposal' },
    ]);
    (Task.countDocuments as jest.Mock).mockResolvedValue(15);

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.totalCaseValue).toBe(15000); // 10000 + 0 + 0 + 0 + 5000
    expect(data.data.wonCaseValue).toBe(10000); // Only first case (second has undefined value = 0)
    expect(data.data.openCaseValue).toBe(5000); // Only proposal case
    expect(data.data.wonCases).toBe(2); // Two closed-won cases
    expect(data.data.openCases).toBe(2); // lead and proposal
  });

  it('should handle errors during stats fetch', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);
    (Contact.countDocuments as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});

