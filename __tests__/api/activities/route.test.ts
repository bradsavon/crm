// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/lib/activity', () => ({
  __esModule: true,
  getActivities: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  getCurrentUser: jest.fn(),
  hasPermission: jest.fn(),
}));

import { GET } from '@/app/api/activities/route';
import { getActivities } from '@/lib/activity';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { createMockRequest, createMockUser } from '../../utils/test-helpers';
import { NextRequest } from 'next/server';

describe('GET /api/activities', () => {
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

  it('should return activities for authenticated user', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const mockActivities = [
      {
        _id: '1',
        type: 'created',
        entityType: 'contact',
        description: 'Created contact',
      },
    ];

    (getActivities as jest.Mock).mockResolvedValue(mockActivities);

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    // entityType can be null when not provided in query params
    expect(getActivities).toHaveBeenCalledWith(null, undefined, 'user-id', 50);
  });

  it('should filter activities by entityType', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const mockActivities = [];
    (getActivities as jest.Mock).mockResolvedValue(mockActivities);

    const request = new NextRequest('http://localhost:3000/api/activities?entityType=contact');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(getActivities).toHaveBeenCalledWith('contact', undefined, undefined, 50);
  });

  it('should allow manager to view all activities', async () => {
    const manager = createMockUser({ id: 'manager-id', role: 'manager' });
    (getCurrentUser as jest.Mock).mockResolvedValue(manager);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const mockActivities = [];
    (getActivities as jest.Mock).mockResolvedValue(mockActivities);

    const request = new NextRequest('http://localhost:3000/api/activities?userId=other-user-id');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(getActivities).toHaveBeenCalledWith(null, undefined, 'other-user-id', 50);
  });
});

