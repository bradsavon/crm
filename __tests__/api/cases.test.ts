// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/Case', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    create: jest.fn(),
  },
}));

import { GET, POST } from '@/app/api/cases/route';
import Case from '@/models/Case';
import { createMockRequest } from '../utils/test-helpers';

describe('GET /api/cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all cases', async () => {
    const mockCases = [
      { _id: '1', title: 'Case 1', value: 10000, stage: 'lead' },
      { _id: '2', title: 'Case 2', value: 20000, stage: 'qualified' },
    ];

    const mockFind = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockCases),
    });
    (Case.find as jest.Mock) = mockFind;

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.data[0].title).toBe('Case 1');
  });

  it('should handle database errors', async () => {
    const mockFind = jest.fn().mockReturnValue({
      sort: jest.fn().mockRejectedValue(new Error('Database error')),
    });
    (Case.find as jest.Mock) = mockFind;

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});

describe('POST /api/cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new case', async () => {
    const caseData = {
      title: 'New Case',
      value: 50000,
      stage: 'lead',
      probability: 25,
    };

    const mockCase = {
      _id: 'case-id',
      ...caseData,
    };

    (Case.create as jest.Mock).mockResolvedValue(mockCase);

    const request = createMockRequest('POST', caseData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('New Case');
    expect(Case.create).toHaveBeenCalledWith(caseData);
  });

  it('should handle validation errors', async () => {
    const invalidCaseData = {
      title: '', // Invalid: empty title
      value: -100, // Invalid: negative value
    };

    (Case.create as jest.Mock).mockRejectedValue(
      new Error('Case validation failed: title: Case title is required')
    );

    const request = createMockRequest('POST', invalidCaseData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('validation failed');
  });
});
