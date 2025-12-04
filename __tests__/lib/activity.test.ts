// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/Activity', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    find: jest.fn(),
  },
}));

import { createActivity, getActivities } from '@/lib/activity';
import Activity from '@/models/Activity';
import connectDB from '@/lib/mongodb';

describe('Activity Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createActivity', () => {
    it('should create an activity log entry', async () => {
      const activityData = {
        type: 'created' as const,
        entityType: 'contact' as const,
        entityId: 'contact-id',
        userId: 'user-id',
        userName: 'Test User',
        description: 'Created contact',
      };

      (Activity.create as jest.Mock).mockResolvedValue(activityData);

      await createActivity(activityData);

      expect(connectDB).toHaveBeenCalled();
      expect(Activity.create).toHaveBeenCalledWith(activityData);
    });

    it('should not throw on error', async () => {
      const activityData = {
        type: 'created' as const,
        entityType: 'contact' as const,
        entityId: 'contact-id',
        userId: 'user-id',
        userName: 'Test User',
        description: 'Created contact',
      };

      (Activity.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(createActivity(activityData)).resolves.not.toThrow();
    });
  });

  describe('getActivities', () => {
    it('should fetch activities without filters', async () => {
      const mockActivities = [
        {
          _id: '1',
          type: 'created',
          entityType: 'contact',
          description: 'Created contact',
        },
      ];

      (Activity.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockActivities),
          }),
        }),
      });

      const activities = await getActivities();

      expect(connectDB).toHaveBeenCalled();
      expect(Activity.find).toHaveBeenCalledWith({});
      expect(activities).toEqual(mockActivities);
    });

    it('should filter activities by entityType', async () => {
      const mockActivities = [
        {
          _id: '1',
          type: 'created',
          entityType: 'contact',
          description: 'Created contact',
        },
      ];

      (Activity.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockActivities),
          }),
        }),
      });

      const activities = await getActivities('contact');

      expect(Activity.find).toHaveBeenCalledWith({ entityType: 'contact' });
      expect(activities).toEqual(mockActivities);
    });

    it('should filter activities by entityId', async () => {
      const mockActivities = [
        {
          _id: '1',
          type: 'created',
          entityType: 'contact',
          entityId: 'contact-id',
          description: 'Created contact',
        },
      ];

      (Activity.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockActivities),
          }),
        }),
      });

      const activities = await getActivities(undefined, 'contact-id');

      expect(Activity.find).toHaveBeenCalledWith({ entityId: 'contact-id' });
      expect(activities).toEqual(mockActivities);
    });

    it('should return empty array on error', async () => {
      (Activity.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      const activities = await getActivities();

      expect(activities).toEqual([]);
    });
  });
});

