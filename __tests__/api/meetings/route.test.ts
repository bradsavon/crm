// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/Meeting', () => ({
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
  hasPermission: jest.fn(),
}));

jest.mock('@/lib/activity', () => ({
  __esModule: true,
  createActivity: jest.fn(),
}));

import { GET, POST } from '@/app/api/meetings/route';
import Meeting from '@/models/Meeting';
import { getCurrentUser } from '@/lib/auth';
import { createMockRequest, createMockUser } from '../../utils/test-helpers';
import { NextRequest } from 'next/server';

describe('GET /api/meetings', () => {
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
  });

  it('should return meetings for authenticated user', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const mockMeetings = [
      {
        _id: '1',
        title: 'Meeting 1',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        organizer: 'user-id',
      },
    ];

    (Meeting.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockMeetings),
        }),
      }),
    });

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
  });

  it('should filter meetings by date range', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const mockMeetings = [];
    (Meeting.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockMeetings),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/meetings?start=2024-01-01&end=2024-01-31');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Meeting.find).toHaveBeenCalled();
  });

  it('should filter meetings by userId when provided', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const mockMeetings = [];
    (Meeting.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockMeetings),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/meetings?userId=other-user-id');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Meeting.find).toHaveBeenCalled();
  });

  it('should return meetings for current user when no userId provided', async () => {
    const user = createMockUser({ id: 'user-id' });
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const mockMeetings = [
      {
        _id: '1',
        title: 'Meeting 1',
        organizer: 'user-id',
      },
    ];

    (Meeting.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockMeetings),
        }),
      }),
    });

    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
  });

  it('should handle errors during get', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (Meeting.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
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

describe('POST /api/meetings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('POST', {
      title: 'New Meeting',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T11:00:00Z',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return 400 if required fields are missing', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const request = createMockRequest('POST', {
      title: 'New Meeting',
      // Missing startTime and endTime
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('required');
  });

  it('should return 400 if end time is before start time', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const request = createMockRequest('POST', {
      title: 'New Meeting',
      startTime: '2024-01-01T11:00:00Z',
      endTime: '2024-01-01T10:00:00Z', // Before start time
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('End time must be after start time');
  });

  it('should create meeting successfully', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const meetingData = {
      title: 'New Meeting',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T11:00:00Z',
      description: 'Meeting description',
      location: 'Conference Room A',
    };

    const mockMeeting = {
      _id: 'meeting-id',
      ...meetingData,
      organizer: user.id,
    };

    (Meeting.create as jest.Mock).mockResolvedValue(mockMeeting);
    (Meeting.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockMeeting),
      }),
    });

    const request = createMockRequest('POST', meetingData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('New Meeting');
    expect(Meeting.create).toHaveBeenCalled();
  });

  it('should create meeting with related entity', async () => {
    const { createActivity } = require('@/lib/activity');
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const meetingData = {
      title: 'New Meeting',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T11:00:00Z',
      relatedEntityType: 'contact',
      relatedEntityId: 'contact-id',
    };

    const mockMeeting = {
      _id: 'meeting-id',
      ...meetingData,
      organizer: user.id,
    };

    (Meeting.create as jest.Mock).mockResolvedValue(mockMeeting);
    (Meeting.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockMeeting),
      }),
    });

    const request = createMockRequest('POST', meetingData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(createActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'created',
        entityType: 'contact',
        entityId: 'contact-id',
        description: expect.stringContaining('Scheduled meeting'),
      })
    );
  });

  it('should create meeting with relatedEntityType but no relatedEntityId', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const meetingData = {
      title: 'New Meeting',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T11:00:00Z',
      relatedEntityType: 'contact',
      relatedEntityId: '', // Empty string
    };

    const mockMeeting = {
      _id: 'meeting-id',
      title: meetingData.title,
      startTime: meetingData.startTime,
      endTime: meetingData.endTime,
      relatedEntityType: 'contact',
      organizer: user.id,
    };

    (Meeting.create as jest.Mock).mockResolvedValue(mockMeeting);
    (Meeting.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockMeeting),
      }),
    });

    const request = createMockRequest('POST', meetingData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    // relatedEntityId should not be included
    expect(Meeting.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ relatedEntityId: '' })
    );
  });

  it('should not include relatedEntityType if empty string', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    const meetingData = {
      title: 'New Meeting',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T11:00:00Z',
      relatedEntityType: '', // Empty string
      relatedEntityId: 'contact-id',
    };

    const mockMeeting = {
      _id: 'meeting-id',
      title: meetingData.title,
      startTime: meetingData.startTime,
      endTime: meetingData.endTime,
      organizer: user.id,
    };

    (Meeting.create as jest.Mock).mockResolvedValue(mockMeeting);
    (Meeting.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockMeeting),
      }),
    });

    const request = createMockRequest('POST', meetingData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    // relatedEntityType should not be included
    expect(Meeting.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ relatedEntityType: '' })
    );
  });

  it('should handle errors during create', async () => {
    const user = createMockUser();
    (getCurrentUser as jest.Mock).mockResolvedValue(user);
    (Meeting.create as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('POST', {
      title: 'New Meeting',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T11:00:00Z',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});

