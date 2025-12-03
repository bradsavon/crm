import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserAvailability from '@/models/UserAvailability';
import { getCurrentUser } from '@/lib/auth';

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
    const userId = searchParams.get('userId') || currentUser.id;

    // Only allow users to view their own availability unless admin/manager
    if (userId !== currentUser.id && currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const availability = await UserAvailability.find({ user: userId }).sort({ dayOfWeek: 1 });

    return NextResponse.json({ success: true, data: availability });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();
    const body = await request.json();

    // Validate required fields
    if (body.dayOfWeek === undefined || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { success: false, error: 'Day of week, start time, and end time are required' },
        { status: 400 }
      );
    }

    // Validate time format
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(body.startTime) || !timeRegex.test(body.endTime)) {
      return NextResponse.json(
        { success: false, error: 'Invalid time format. Use HH:mm format' },
        { status: 400 }
      );
    }

    // Validate end time is after start time
    const [startHour, startMin] = body.startTime.split(':').map(Number);
    const [endHour, endMin] = body.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      return NextResponse.json(
        { success: false, error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Upsert availability
    const availability = await UserAvailability.findOneAndUpdate(
      { user: currentUser.id, dayOfWeek: body.dayOfWeek },
      {
        user: currentUser.id,
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        isAvailable: body.isAvailable !== false,
        timezone: body.timezone || 'UTC',
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: availability }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

