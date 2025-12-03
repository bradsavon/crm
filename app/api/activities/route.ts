import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getActivities } from '@/lib/activity';
import { getCurrentUser, hasPermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('entityType') as 'contact' | 'company' | 'case' | 'user' | null;
    const entityId = searchParams.get('entityId') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');

    // Users can only see their own activities unless they're admin/manager
    let filterUserId = userId;
    if (!hasPermission(currentUser, 'manager') && (!userId || userId !== currentUser.id)) {
      filterUserId = currentUser.id;
    }

    const activities = await getActivities(entityType, entityId, filterUserId, limit);

    return NextResponse.json({ success: true, data: activities });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

