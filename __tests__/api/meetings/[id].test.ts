// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/Meeting', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
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

jest.mock('@/lib/activity', () => ({
  __esModule: true,
  createActivity: jest.fn(),
}));

import { GET, PUT, DELETE } from '@/app/api/meetings/[id]/route';
import Meeting from '@/models/Meeting';
import Contact from '@/models/Contact';
import Company from '@/models/Company';
import Case from '@/models/Case';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { createMockRequest, createMockUser } from '../../utils/test-helpers';

describe('GET /api/meetings/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'meeting-id' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return meeting with related entity name', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const mockMeeting = {
      _id: 'meeting-id',
      title: 'Test Meeting',
      organizer: { _id: 'user-id' },
      attendees: [],
      relatedEntityType: 'contact',
      relatedEntityId: 'contact-id',
      toObject: jest.fn(() => ({
        _id: 'meeting-id',
        title: 'Test Meeting',
        organizer: { _id: 'user-id' },
        attendees: [],
        relatedEntityType: 'contact',
        relatedEntityId: 'contact-id',
      })),
    };

    (Meeting.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockMeeting),
      }),
    });

    (Contact.findById as jest.Mock).mockResolvedValue({
      firstName: 'John',
      lastName: 'Doe',
    });

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'meeting-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('Test Meeting');
    expect(data.data.relatedEntityName).toBe('John Doe');
  });

  it('should return meeting with company related entity', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const mockMeeting = {
      _id: 'meeting-id',
      title: 'Test Meeting',
      organizer: { _id: 'user-id' },
      attendees: [],
      relatedEntityType: 'company',
      relatedEntityId: 'company-id',
      toObject: jest.fn(() => ({
        _id: 'meeting-id',
        title: 'Test Meeting',
        organizer: { _id: 'user-id' },
        attendees: [],
        relatedEntityType: 'company',
        relatedEntityId: 'company-id',
      })),
    };

    (Meeting.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockMeeting),
      }),
    });

    (Company.findById as jest.Mock).mockResolvedValue({
      name: 'Test Company',
    });

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'meeting-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.relatedEntityName).toBe('Test Company');
  });

  it('should return meeting with case related entity', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const mockMeeting = {
      _id: 'meeting-id',
      title: 'Test Meeting',
      organizer: { _id: 'user-id' },
      attendees: [],
      relatedEntityType: 'case',
      relatedEntityId: 'case-id',
      toObject: jest.fn(() => ({
        _id: 'meeting-id',
        title: 'Test Meeting',
        organizer: { _id: 'user-id' },
        attendees: [],
        relatedEntityType: 'case',
        relatedEntityId: 'case-id',
      })),
    };

    (Meeting.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockMeeting),
      }),
    });

    (Case.findById as jest.Mock).mockResolvedValue({
      title: 'Test Case',
    });

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'meeting-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.relatedEntityName).toBe('Test Case');
  });

  it('should return meeting for attendee', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const mockMeeting = {
      _id: 'meeting-id',
      title: 'Test Meeting',
      organizer: { _id: 'other-user-id' },
      attendees: [{ _id: 'user-id' }],
      toObject: jest.fn(() => ({
        _id: 'meeting-id',
        organizer: { _id: 'other-user-id' },
        attendees: [{ _id: 'user-id' }],
      })),
    };

    (Meeting.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockMeeting),
      }),
    });

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'meeting-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should handle errors when fetching related entity', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(true);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const mockMeeting = {
      _id: 'meeting-id',
      title: 'Test Meeting',
      organizer: { _id: 'user-id' },
      attendees: [],
      relatedEntityType: 'contact',
      relatedEntityId: 'contact-id',
      toObject: jest.fn(() => ({
        _id: 'meeting-id',
        organizer: { _id: 'user-id' },
        attendees: [],
        relatedEntityType: 'contact',
        relatedEntityId: 'contact-id',
      })),
    };

    (Meeting.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockMeeting),
      }),
    });

    (Contact.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'meeting-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.relatedEntityName).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should return 404 if meeting not found', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    (Meeting.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      }),
    });

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'non-existent-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Meeting not found');
  });

  it('should return 403 if user is not organizer or attendee', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const mockMeeting = {
      _id: 'meeting-id',
      title: 'Test Meeting',
      organizer: { _id: 'other-user-id' },
      attendees: [],
      toObject: jest.fn(() => ({
        _id: 'meeting-id',
        organizer: { _id: 'other-user-id' },
        attendees: [],
      })),
    };

    (Meeting.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockMeeting),
      }),
    });

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'meeting-id' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Insufficient permissions');
  });

  it('should handle database errors', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    (Meeting.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Database error')),
      }),
    });

    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'meeting-id' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});

describe('PUT /api/meetings/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('PUT', { title: 'Updated Meeting' });
    const response = await PUT(request, { params: { id: 'meeting-id' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return 404 if meeting not found', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    (Meeting.findById as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('PUT', { title: 'Updated Meeting' });
    const response = await PUT(request, { params: { id: 'non-existent-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Meeting not found');
  });

  it('should return 403 if user lacks permission', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const existingMeeting = {
      _id: 'meeting-id',
      title: 'Old Meeting',
      organizer: 'other-user-id',
      toObject: jest.fn(() => ({
        _id: 'meeting-id',
        organizer: 'other-user-id',
      })),
    };

    (Meeting.findById as jest.Mock).mockResolvedValue(existingMeeting);

    const request = createMockRequest('PUT', { title: 'Updated Meeting' });
    const response = await PUT(request, { params: { id: 'meeting-id' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Insufficient permissions');
  });

  it('should return 400 if end time is before start time', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const existingMeeting = {
      _id: 'meeting-id',
      title: 'Old Meeting',
      organizer: 'user-id',
      toObject: jest.fn(() => ({
        _id: 'meeting-id',
        organizer: 'user-id',
      })),
    };

    (Meeting.findById as jest.Mock).mockResolvedValue(existingMeeting);

    const request = createMockRequest('PUT', {
      startTime: '2024-01-01T11:00:00Z',
      endTime: '2024-01-01T10:00:00Z',
    });
    const response = await PUT(request, { params: { id: 'meeting-id' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('End time must be after start time');
  });

  it('should update meeting successfully for organizer', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const existingMeeting = {
      _id: 'meeting-id',
      title: 'Old Meeting',
      organizer: 'user-id',
      relatedEntityType: null,
      relatedEntityId: null,
      save: jest.fn().mockResolvedValue(true),
      toObject: jest.fn(() => ({
        _id: 'meeting-id',
        organizer: 'user-id',
      })),
    };

    const updatedMeeting = {
      _id: 'meeting-id',
      title: 'Updated Meeting',
      organizer: 'user-id',
    };

    (Meeting.findById as jest.Mock)
      .mockResolvedValueOnce(existingMeeting)
      .mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(updatedMeeting),
        }),
      });

    const request = createMockRequest('PUT', { title: 'Updated Meeting' });
    const response = await PUT(request, { params: { id: 'meeting-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('Updated Meeting');
    expect(existingMeeting.save).toHaveBeenCalled();
  });

  it('should log activity when meeting has related entity', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const existingMeeting = {
      _id: 'meeting-id',
      title: 'Old Meeting',
      organizer: 'user-id',
      relatedEntityType: 'contact',
      relatedEntityId: 'contact-id',
      save: jest.fn().mockResolvedValue(true),
      toObject: jest.fn(() => ({
        _id: 'meeting-id',
        organizer: 'user-id',
      })),
    };

    const updatedMeeting = {
      _id: 'meeting-id',
      title: 'Updated Meeting',
      organizer: 'user-id',
      relatedEntityType: 'contact',
      relatedEntityId: 'contact-id',
    };

    (Meeting.findById as jest.Mock)
      .mockResolvedValueOnce(existingMeeting)
      .mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(updatedMeeting),
        }),
      });

    const { createActivity } = require('@/lib/activity');

    const request = createMockRequest('PUT', { title: 'Updated Meeting' });
    const response = await PUT(request, { params: { id: 'meeting-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(createActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'updated',
        description: expect.stringContaining('Updated meeting'),
      })
    );
  });

  it('should handle database errors', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    (Meeting.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('PUT', { title: 'Updated Meeting' });
    const response = await PUT(request, { params: { id: 'meeting-id' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});

describe('DELETE /api/meetings/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'meeting-id' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return 404 if meeting not found', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    (Meeting.findById as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'non-existent-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Meeting not found');
  });

  it('should return 403 if user lacks permission', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const mockMeeting = {
      _id: 'meeting-id',
      title: 'Test Meeting',
      organizer: 'other-user-id',
      toObject: jest.fn(() => ({
        _id: 'meeting-id',
        organizer: 'other-user-id',
      })),
    };

    (Meeting.findById as jest.Mock).mockResolvedValue(mockMeeting);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'meeting-id' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Insufficient permissions');
  });

  it('should cancel meeting successfully for organizer', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const mockMeeting = {
      _id: 'meeting-id',
      title: 'Test Meeting',
      organizer: 'user-id',
      relatedEntityType: null,
      relatedEntityId: null,
      toObject: jest.fn(() => ({
        _id: 'meeting-id',
        organizer: 'user-id',
      })),
    };

    (Meeting.findById as jest.Mock).mockResolvedValue(mockMeeting);
    (Meeting.findByIdAndDelete as jest.Mock).mockResolvedValue(mockMeeting);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'meeting-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Meeting deleted');
    expect(Meeting.findByIdAndDelete).toHaveBeenCalledWith('meeting-id');
  });

  it('should log activity when meeting has related entity', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const mockMeeting = {
      _id: 'meeting-id',
      title: 'Test Meeting',
      organizer: 'user-id',
      relatedEntityType: 'contact',
      relatedEntityId: 'contact-id',
      toObject: jest.fn(() => ({
        _id: 'meeting-id',
        organizer: 'user-id',
      })),
    };

    (Meeting.findById as jest.Mock).mockResolvedValue(mockMeeting);
    (Meeting.findByIdAndDelete as jest.Mock).mockResolvedValue(mockMeeting);

    const { createActivity } = require('@/lib/activity');

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'meeting-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(createActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'deleted',
        description: expect.stringContaining('Cancelled meeting'),
      })
    );
  });

  it('should handle database errors', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    (Meeting.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('DELETE');
    const response = await DELETE(request, { params: { id: 'meeting-id' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});
