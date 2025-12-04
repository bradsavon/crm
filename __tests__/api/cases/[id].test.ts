// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/Case', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

import { GET, PUT, DELETE } from '@/app/api/cases/[id]/route';
import Case from '@/models/Case';
import { createMockRequest } from '../../utils/test-helpers';

describe('GET /api/cases/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return case by id', async () => {
    const mockCase = {
      _id: 'case-id',
      title: 'Test Case',
      value: 50000,
      stage: 'lead',
    };

    (Case.findById as jest.Mock).mockResolvedValue(mockCase);

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'case-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('Test Case');
  });

  it('should return 404 if case not found', async () => {
    (Case.findById as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'non-existent-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Case not found');
  });
});

describe('PUT /api/cases/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update case successfully', async () => {
    const caseData = {
      title: 'Updated Case',
      value: 60000,
      stage: 'qualified',
    };

    const mockCase = {
      _id: 'case-id',
      ...caseData,
    };

    (Case.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockCase);

    const request = createMockRequest('PUT', caseData);
    const response = await PUT(request, { params: { id: 'case-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('Updated Case');
    expect(Case.findByIdAndUpdate).toHaveBeenCalledWith(
      'case-id',
      caseData,
      { new: true, runValidators: true }
    );
  });

  it('should return 404 if case not found', async () => {
    (Case.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('PUT', { title: 'Updated' });
    const response = await PUT(request, { params: { id: 'non-existent-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Case not found');
  });
});

describe('DELETE /api/cases/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete case successfully', async () => {
    const mockCase = {
      _id: 'case-id',
      title: 'Test Case',
    };

    (Case.findByIdAndDelete as jest.Mock).mockResolvedValue(mockCase);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'case-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Case.findByIdAndDelete).toHaveBeenCalledWith('case-id');
  });

  it('should return 404 if case not found', async () => {
    (Case.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'non-existent-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Case not found');
  });
});

