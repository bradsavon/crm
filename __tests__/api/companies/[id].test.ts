// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/Company', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

import { GET, PUT, DELETE } from '@/app/api/companies/[id]/route';
import Company from '@/models/Company';
import { createMockRequest } from '../../utils/test-helpers';

describe('GET /api/companies/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return company by id', async () => {
    const mockCompany = {
      _id: 'company-id',
      name: 'Test Company',
      industry: 'Technology',
    };

    (Company.findById as jest.Mock).mockResolvedValue(mockCompany);

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'company-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('Test Company');
  });

  it('should return 404 if company not found', async () => {
    (Company.findById as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'non-existent-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Company not found');
  });
});

describe('PUT /api/companies/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update company successfully', async () => {
    const companyData = {
      name: 'Updated Company',
      industry: 'Finance',
    };

    const mockCompany = {
      _id: 'company-id',
      ...companyData,
    };

    (Company.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockCompany);

    const request = createMockRequest('PUT', companyData);
    const response = await PUT(request, { params: { id: 'company-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('Updated Company');
  });

  it('should return 404 if company not found for update', async () => {
    (Company.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('PUT', { name: 'Updated Company' });
    const response = await PUT(request, { params: { id: 'non-existent-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Company not found');
  });

  it('should handle errors during update', async () => {
    (Company.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('PUT', { name: 'Updated Company' });
    const response = await PUT(request, { params: { id: 'company-id' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });

  it('should handle errors during get', async () => {
    (Company.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'company-id' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});

describe('DELETE /api/companies/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete company successfully', async () => {
    const mockCompany = {
      _id: 'company-id',
      name: 'Test Company',
    };

    (Company.findByIdAndDelete as jest.Mock).mockResolvedValue(mockCompany);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'company-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Company.findByIdAndDelete).toHaveBeenCalledWith('company-id');
  });

  it('should return 404 if company not found for delete', async () => {
    (Company.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'non-existent-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Company not found');
  });

  it('should handle errors during delete', async () => {
    (Company.findByIdAndDelete as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'company-id' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});

