// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/Document', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  getCurrentUser: jest.fn(),
  hasPermission: jest.fn(),
}));

jest.mock('@/lib/activity', () => ({
  __esModule: true,
  createActivity: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  unlink: jest.fn(),
}));

import { GET, DELETE } from '@/app/api/documents/[id]/route';
import Document from '@/models/Document';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { createMockRequest, createMockUser } from '../../utils/test-helpers';

describe('GET /api/documents/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'doc-id' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return document by id', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const mockDocument = {
      _id: 'doc-id',
      filename: 'test.pdf',
      originalName: 'test.pdf',
      path: '/uploads/test.pdf',
    };

    (Document.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockDocument),
    });

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'doc-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.filename).toBe('test.pdf');
  });

  it('should return 404 if document not found', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    (Document.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'non-existent-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Document not found');
  });
});

describe('DELETE /api/documents/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'doc-id' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should delete document successfully for creator', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const mockDocument = {
      _id: 'doc-id',
      filename: 'test.pdf',
      originalName: 'test.pdf',
      path: 'uploads/test.pdf',
      relatedEntityType: 'contact',
      relatedEntityId: 'contact-id',
      toObject: jest.fn(() => ({
        _id: 'doc-id',
        uploadedBy: 'user-id',
      })),
    };

    (Document.findById as jest.Mock).mockResolvedValue(mockDocument);
    (Document.findByIdAndDelete as jest.Mock).mockResolvedValue(mockDocument);
    (unlink as jest.Mock).mockResolvedValue(undefined);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'doc-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Document deleted successfully');
    expect(Document.findByIdAndDelete).toHaveBeenCalledWith('doc-id');
  });

  it('should return 403 if user lacks permission', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const mockDocument = {
      _id: 'doc-id',
      toObject: jest.fn(() => ({
        _id: 'doc-id',
        uploadedBy: 'other-user-id',
      })),
    };

    (Document.findById as jest.Mock).mockResolvedValue(mockDocument);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'doc-id' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Insufficient permissions');
  });
});

