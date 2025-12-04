// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/Contact', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  getCurrentUser: jest.fn(),
}));

jest.mock('@/lib/activity', () => ({
  __esModule: true,
  createActivity: jest.fn(),
}));

import { GET, POST } from '@/app/api/contacts/route';
import Contact from '@/models/Contact';
import { getCurrentUser } from '@/lib/auth';
import { createMockRequest, createMockUser } from '../utils/test-helpers';

describe('GET /api/contacts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all contacts for admin user', async () => {
    const adminUser = createMockUser({ role: 'admin' });
    (getCurrentUser as jest.Mock).mockResolvedValue(adminUser);

    const mockContacts = [
      { _id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      { _id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
    ];

    (Contact.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockContacts),
        }),
      }),
    });

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(Contact.find).toHaveBeenCalledWith({});
  });

  it('should filter contacts by assignedTo for sales rep', async () => {
    const salesRep = createMockUser({ role: 'salesrep', id: 'salesrep-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(salesRep);

    const mockContacts = [
      { _id: '1', firstName: 'John', lastName: 'Doe', assignedTo: 'salesrep-id' },
    ];

    (Contact.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockContacts),
        }),
      }),
    });

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Contact.find).toHaveBeenCalledWith({
      $or: [
        { assignedTo: 'salesrep-id' },
        { createdBy: 'salesrep-id' },
      ],
    });
  });
});

describe('POST /api/contacts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('POST', {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Not authenticated');
  });

  it('should create a contact with authenticated user', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const contactData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };

    const mockContact = {
      _id: 'contact-id',
      ...contactData,
      createdBy: user.id,
      assignedTo: user.id,
    };

    (Contact.create as jest.Mock).mockResolvedValue(mockContact);
    (Contact.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockContact),
      }),
    });

    const request = createMockRequest('POST', contactData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.firstName).toBe('John');
    expect(Contact.create).toHaveBeenCalledWith({
      ...contactData,
      createdBy: user.id,
      assignedTo: user.id,
    });
  });

  it('should use provided assignedTo if specified', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const contactData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      assignedTo: 'other-user-id',
    };

    const mockContact = {
      _id: 'contact-id',
      ...contactData,
      createdBy: user.id,
    };

    (Contact.create as jest.Mock).mockResolvedValue(mockContact);
    (Contact.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockContact),
      }),
    });

    const request = createMockRequest('POST', contactData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(Contact.create).toHaveBeenCalledWith({
      ...contactData,
      createdBy: user.id,
    });
  });
});

