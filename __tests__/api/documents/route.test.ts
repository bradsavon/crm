// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/Document', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

jest.mock('@/models/Contact', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock('@/models/Company', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock('@/models/Case', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  getCurrentUser: jest.fn(),
  hasPermission: jest.fn(),
}));

import { GET } from '@/app/api/documents/route';
import Document from '@/models/Document';
import Contact from '@/models/Contact';
import Company from '@/models/Company';
import Case from '@/models/Case';
import { getCurrentUser } from '@/lib/auth';
import { createMockRequest, createMockUser } from '../../utils/test-helpers';
import { NextRequest } from 'next/server';

describe('GET /api/documents', () => {
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

  it('should return all documents for authenticated user', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const mockDocuments = [
      {
        _id: '1',
        filename: 'doc1.pdf',
        relatedEntityType: 'contact',
        relatedEntityId: 'contact-id',
        toObject: jest.fn(() => ({
          _id: '1',
          filename: 'doc1.pdf',
          relatedEntityType: 'contact',
          relatedEntityId: 'contact-id',
        })),
      },
    ];

    (Document.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockDocuments),
      }),
    });

    (Contact.findById as jest.Mock).mockResolvedValue({
      firstName: 'John',
      lastName: 'Doe',
    });

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].relatedEntityName).toBe('John Doe');
  });

  it('should filter documents by relatedEntityType and relatedEntityId', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const mockDocuments = [
      {
        _id: '1',
        filename: 'doc1.pdf',
        relatedEntityType: 'contact',
        relatedEntityId: 'contact-id',
        toObject: jest.fn(() => ({
          _id: '1',
          filename: 'doc1.pdf',
          relatedEntityType: 'contact',
          relatedEntityId: 'contact-id',
        })),
      },
    ];

    (Document.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockDocuments),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/documents?relatedEntityType=contact&relatedEntityId=contact-id');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Document.find).toHaveBeenCalledWith({
      relatedEntityType: 'contact',
      relatedEntityId: 'contact-id',
    });
  });

  it('should filter documents by category', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const mockDocuments = [];

    (Document.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockDocuments),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/documents?category=Contract');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Document.find).toHaveBeenCalledWith({
      category: 'Contract',
    });
  });

  it('should handle documents with company related entities', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const mockDocuments = [
      {
        _id: '1',
        filename: 'doc1.pdf',
        relatedEntityType: 'company',
        relatedEntityId: 'company-id',
        toObject: jest.fn(() => ({
          _id: '1',
          filename: 'doc1.pdf',
          relatedEntityType: 'company',
          relatedEntityId: 'company-id',
        })),
      },
    ];

    (Document.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockDocuments),
      }),
    });

    (Company.findById as jest.Mock).mockResolvedValue({
      name: 'Test Company',
    });

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data[0].relatedEntityName).toBe('Test Company');
  });

  it('should handle documents with case related entities', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const mockDocuments = [
      {
        _id: '1',
        filename: 'doc1.pdf',
        relatedEntityType: 'case',
        relatedEntityId: 'case-id',
        toObject: jest.fn(() => ({
          _id: '1',
          filename: 'doc1.pdf',
          relatedEntityType: 'case',
          relatedEntityId: 'case-id',
        })),
      },
    ];

    (Document.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockDocuments),
      }),
    });

    (Case.findById as jest.Mock).mockResolvedValue({
      title: 'Test Case',
    });

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data[0].relatedEntityName).toBe('Test Case');
  });

  it('should handle errors when fetching related entity', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const mockDocuments = [
      {
        _id: '1',
        filename: 'doc1.pdf',
        relatedEntityType: 'contact',
        relatedEntityId: 'contact-id',
        toObject: jest.fn(() => ({
          _id: '1',
          filename: 'doc1.pdf',
          relatedEntityType: 'contact',
          relatedEntityId: 'contact-id',
        })),
      },
    ];

    (Document.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockDocuments),
      }),
    });

    (Contact.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data[0].relatedEntityName).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle database errors', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    (Document.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Database error')),
      }),
    });

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});

