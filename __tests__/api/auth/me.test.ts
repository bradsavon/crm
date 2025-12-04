// Mock dependencies BEFORE imports
jest.mock('@/lib/auth', () => ({
  __esModule: true,
  getCurrentUser: jest.fn(),
}));

import { GET } from '@/app/api/auth/me/route';
import { getCurrentUser } from '@/lib/auth';
import { createMockRequest, createMockUser } from '../../utils/test-helpers';

describe('GET /api/auth/me', () => {
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

  it('should return current user data when authenticated', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(user.id);
    expect(data.data.email).toBe(user.email);
    expect(data.data.role).toBe(user.role);
  });

  it('should handle errors gracefully', async () => {
    (getCurrentUser as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});

