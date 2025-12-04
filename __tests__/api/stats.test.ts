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
});

