// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/Contact', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
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

import { GET, PUT, DELETE } from '@/app/api/contacts/[id]/route';
import Contact from '@/models/Contact';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { createMockRequest, createMockUser } from '../../utils/test-helpers';

describe('GET /api/contacts/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 if contact not found', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);
    (Contact.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      }),
    });

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'non-existent-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Contact not found');
  });

  it('should return contact for admin/manager', async () => {
    const manager = createMockUser({ role: 'manager' });
    (getCurrentUser as jest.Mock).mockResolvedValue(manager);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const mockContact = {
      _id: 'contact-id',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      toObject: jest.fn(() => ({
        _id: 'contact-id',
        assignedTo: { _id: 'other-user-id' },
        createdBy: { _id: 'other-user-id' },
      })),
    };

    (Contact.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockContact),
      }),
    });

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'contact-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.firstName).toBe('John');
  });

  it('should return 403 if user lacks permission', async () => {
    const salesRep = createMockUser({ role: 'salesrep', id: 'salesrep-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(salesRep);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const mockContact = {
      _id: 'contact-id',
      firstName: 'John',
      lastName: 'Doe',
      toObject: jest.fn(() => ({
        _id: 'contact-id',
        assignedTo: { _id: 'other-user-id' },
        createdBy: { _id: 'other-user-id' },
      })),
    };

    (Contact.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockContact),
      }),
    });

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'contact-id' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Insufficient permissions');
  });

  it('should return contact for sales rep viewing their own assigned contact', async () => {
    const salesRep = createMockUser({ role: 'salesrep', id: 'salesrep-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(salesRep);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const mockContact = {
      _id: 'contact-id',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      toObject: jest.fn(() => ({
        _id: 'contact-id',
        assignedTo: { _id: 'salesrep-id' },
        createdBy: { _id: 'other-user-id' },
      })),
    };

    (Contact.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockContact),
      }),
    });

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'contact-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.firstName).toBe('John');
  });

  it('should return contact for sales rep viewing their own created contact', async () => {
    const salesRep = createMockUser({ role: 'salesrep', id: 'salesrep-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(salesRep);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const mockContact = {
      _id: 'contact-id',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      toObject: jest.fn(() => ({
        _id: 'contact-id',
        assignedTo: { _id: 'other-user-id' },
        createdBy: { _id: 'salesrep-id' },
      })),
    };

    (Contact.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockContact),
      }),
    });

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'contact-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.firstName).toBe('John');
  });

  it('should handle errors during get', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);
    (Contact.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Database error')),
      }),
    });

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'contact-id' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});

describe('PUT /api/contacts/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('PUT', { firstName: 'Jane' });
    const response = await PUT(request, { params: { id: 'contact-id' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should update contact successfully', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const existingContact = {
      _id: 'contact-id',
      firstName: 'John',
      lastName: 'Doe',
      assignedTo: user.id,
      toObject: jest.fn(() => ({
        _id: 'contact-id',
        assignedTo: user.id,
        createdBy: user.id,
      })),
    };

    const updatedContact = {
      _id: 'contact-id',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    (Contact.findById as jest.Mock).mockResolvedValue(existingContact);
    (Contact.findByIdAndUpdate as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedContact),
      }),
    });

    const request = createMockRequest('PUT', { firstName: 'Jane' });
    const response = await PUT(request, { params: { id: 'contact-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.firstName).toBe('Jane');
  });

  it('should return 404 if contact not found for update', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (Contact.findById as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('PUT', { firstName: 'Jane' });
    const response = await PUT(request, { params: { id: 'non-existent-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Contact not found');
  });

  it('should return 403 if user lacks permission to update', async () => {
    const user = createMockUser({ role: 'salesrep', id: 'salesrep-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const existingContact = {
      _id: 'contact-id',
      firstName: 'John',
      lastName: 'Doe',
      assignedTo: 'other-user-id',
      createdBy: 'other-user-id',
      toObject: jest.fn(() => ({
        _id: 'contact-id',
        assignedTo: 'other-user-id',
        createdBy: 'other-user-id',
      })),
    };

    (Contact.findById as jest.Mock).mockResolvedValue(existingContact);

    const request = createMockRequest('PUT', { firstName: 'Jane' });
    const response = await PUT(request, { params: { id: 'contact-id' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Insufficient permissions');
  });

  it('should log assigned activity when assignedTo changes', async () => {
    const { createActivity } = require('@/lib/activity');
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const existingContact = {
      _id: 'contact-id',
      firstName: 'John',
      lastName: 'Doe',
      assignedTo: 'old-user-id',
      toObject: jest.fn(() => ({
        _id: 'contact-id',
        assignedTo: 'old-user-id',
        createdBy: user.id,
      })),
    };

    const updatedContact = {
      _id: 'contact-id',
      firstName: 'John',
      lastName: 'Doe',
      assignedTo: 'new-user-id',
    };

    (Contact.findById as jest.Mock).mockResolvedValue(existingContact);
    (Contact.findByIdAndUpdate as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedContact),
      }),
    });

    const request = createMockRequest('PUT', { assignedTo: 'new-user-id' });
    const response = await PUT(request, { params: { id: 'contact-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(createActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'assigned',
        description: expect.stringContaining('Assigned contact'),
        metadata: { assignedTo: 'new-user-id' },
      })
    );
  });

  it('should handle errors during update', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (Contact.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('PUT', { firstName: 'Jane' });
    const response = await PUT(request, { params: { id: 'contact-id' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});

describe('DELETE /api/contacts/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'contact-id' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should delete contact successfully', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const mockContact = {
      _id: 'contact-id',
      firstName: 'John',
      lastName: 'Doe',
      toObject: jest.fn(() => ({
        _id: 'contact-id',
        createdBy: user.id,
      })),
    };

    (Contact.findById as jest.Mock).mockResolvedValue(mockContact);
    (Contact.findByIdAndDelete as jest.Mock).mockResolvedValue(mockContact);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'contact-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Contact.findByIdAndDelete).toHaveBeenCalledWith('contact-id');
  });

  it('should return 404 if contact not found for delete', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (Contact.findById as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'non-existent-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Contact not found');
  });

  it('should return 403 if user lacks permission to delete', async () => {
    const user = createMockUser({ role: 'salesrep', id: 'salesrep-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const mockContact = {
      _id: 'contact-id',
      firstName: 'John',
      lastName: 'Doe',
      toObject: jest.fn(() => ({
        _id: 'contact-id',
        createdBy: 'other-user-id',
      })),
    };

    (Contact.findById as jest.Mock).mockResolvedValue(mockContact);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'contact-id' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Insufficient permissions');
  });

  it('should allow sales rep to delete their own created contact', async () => {
    const user = createMockUser({ role: 'salesrep', id: 'salesrep-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const mockContact = {
      _id: 'contact-id',
      firstName: 'John',
      lastName: 'Doe',
      toObject: jest.fn(() => ({
        _id: 'contact-id',
        createdBy: 'salesrep-id',
      })),
    };

    (Contact.findById as jest.Mock).mockResolvedValue(mockContact);
    (Contact.findByIdAndDelete as jest.Mock).mockResolvedValue(mockContact);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'contact-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should handle errors during delete', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (Contact.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'contact-id' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});

