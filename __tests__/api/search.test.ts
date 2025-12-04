// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/Contact', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

jest.mock('@/models/Company', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

jest.mock('@/models/Case', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

import { GET } from '@/app/api/search/route';
import { NextRequest } from 'next/server';
import Contact from '@/models/Contact';
import Company from '@/models/Company';
import Case from '@/models/Case';

describe('GET /api/search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty results for empty query', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.contacts).toEqual([]);
    expect(data.data.companies).toEqual([]);
    expect(data.data.cases).toEqual([]);
  });

  it('should search across contacts, companies, and cases', async () => {
    const mockContacts = [
      { _id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    ];
    const mockCompanies = [
      { _id: '1', name: 'Acme Corp', industry: 'Technology' },
    ];
    const mockCases = [
      { _id: '1', title: 'Acme Project', value: 50000 },
    ];

    (Contact.find as jest.Mock).mockReturnValue({
      limit: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockContacts),
      }),
    });

    (Company.find as jest.Mock).mockReturnValue({
      limit: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockCompanies),
      }),
    });

    (Case.find as jest.Mock).mockReturnValue({
      limit: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockCases),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/search?q=acme');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.contacts).toHaveLength(1);
    expect(data.data.companies).toHaveLength(1);
    expect(data.data.cases).toHaveLength(1);
  });

  it('should handle search errors gracefully', async () => {
    (Contact.find as jest.Mock).mockReturnValue({
      limit: jest.fn().mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Database error')),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/search?q=test');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});
