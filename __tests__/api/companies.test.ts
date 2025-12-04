// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/Company', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    create: jest.fn(),
  },
}));

import { GET, POST } from '@/app/api/companies/route';
import Company from '@/models/Company';
import { createMockRequest } from '../utils/test-helpers';

describe('GET /api/companies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all companies', async () => {
    const mockCompanies = [
      { _id: '1', name: 'Company 1', industry: 'Technology' },
      { _id: '2', name: 'Company 2', industry: 'Finance' },
    ];

    const mockFind = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockCompanies),
    });
    (Company.find as jest.Mock) = mockFind;

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.data[0].name).toBe('Company 1');
  });

  it('should handle database errors', async () => {
    const mockFind = jest.fn().mockReturnValue({
      sort: jest.fn().mockRejectedValue(new Error('Database error')),
    });
    (Company.find as jest.Mock) = mockFind;

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});

describe('POST /api/companies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new company', async () => {
    const companyData = {
      name: 'New Company',
      industry: 'Technology',
      website: 'https://example.com',
    };

    const mockCompany = {
      _id: 'company-id',
      ...companyData,
    };

    (Company.create as jest.Mock).mockResolvedValue(mockCompany);

    const request = createMockRequest('POST', companyData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('New Company');
    expect(Company.create).toHaveBeenCalledWith(companyData);
  });

  it('should handle validation errors', async () => {
    const invalidCompanyData = {
      name: '', // Invalid: empty name
    };

    (Company.create as jest.Mock).mockRejectedValue(
      new Error('Company validation failed: name: Company name is required')
    );

    const request = createMockRequest('POST', invalidCompanyData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('validation failed');
  });
});

