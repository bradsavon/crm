import Activity, { ActivityType } from '@/models/Activity';
import connectDB from '@/lib/mongodb';

interface CreateActivityParams {
  type: ActivityType;
  entityType: 'contact' | 'company' | 'case' | 'user';
  entityId: string;
  userId: string;
  userName: string;
  description: string;
  metadata?: Record<string, any>;
}

export async function createActivity(params: CreateActivityParams): Promise<void> {
  try {
    await connectDB();
    await Activity.create(params);
  } catch (error) {
    console.error('Error creating activity:', error);
    // Don't throw - activity logging shouldn't break the main flow
  }
}

export async function getActivities(
  entityType?: 'contact' | 'company' | 'deal' | 'user',
  entityId?: string,
  userId?: string,
  limit: number = 50
) {
  try {
    await connectDB();
    
    const query: any = {};
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (userId) query.userId = userId;

    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'firstName lastName email');

    return activities;
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}

