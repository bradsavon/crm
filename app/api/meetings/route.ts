import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Meeting from '@/models/Meeting';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { createActivity } from '@/lib/activity';

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
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const userId = searchParams.get('userId');

    // Build query
    let query: any = {};

    // Filter by date range if provided
    if (start && end) {
      query.$or = [
        { startTime: { $gte: new Date(start), $lte: new Date(end) } },
        { endTime: { $gte: new Date(start), $lte: new Date(end) } },
        {
          $and: [
            { startTime: { $lte: new Date(start) } },
            { endTime: { $gte: new Date(end) } },
          ],
        },
      ];
    }

    // Filter by user - show meetings where user is organizer or attendee
    if (userId) {
      query.$or = [
        { organizer: userId },
        { attendees: userId },
      ];
    } else {
      // Default: show meetings for current user
      query.$or = [
        { organizer: currentUser.id },
        { attendees: currentUser.id },
      ];
    }

    const meetings = await Meeting.find(query)
      .populate('organizer', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email')
      .sort({ startTime: 1 });

    return NextResponse.json({ success: true, data: meetings });
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
    if (!body.title || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { success: false, error: 'Title, start time, and end time are required' },
        { status: 400 }
      );
    }

    // Validate end time is after start time
    if (new Date(body.endTime) <= new Date(body.startTime)) {
      return NextResponse.json(
        { success: false, error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Clean up the body - remove empty strings for optional enum fields
    const meetingData: any = {
      title: body.title,
      description: body.description || undefined,
      startTime: body.startTime,
      endTime: body.endTime,
      location: body.location || undefined,
      meetingType: body.meetingType || 'in-person',
      videoLink: body.videoLink || undefined,
      organizer: currentUser.id,
      attendees: body.attendees || [],
      reminderMinutes: body.reminderMinutes || [],
      timezone: body.timezone || 'UTC',
    };

    // Only include relatedEntityType and relatedEntityId if they have valid values
    if (body.relatedEntityType && body.relatedEntityType.trim() !== '') {
      meetingData.relatedEntityType = body.relatedEntityType;
      if (body.relatedEntityId && body.relatedEntityId.trim() !== '') {
        meetingData.relatedEntityId = body.relatedEntityId;
      }
    }

    const meeting = await Meeting.create(meetingData);

    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('organizer', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email');

    // Log activity
    if (body.relatedEntityType && body.relatedEntityId) {
      await createActivity({
        type: 'created',
        entityType: body.relatedEntityType,
        entityId: body.relatedEntityId,
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        description: `Scheduled meeting: ${body.title}`,
        metadata: { meetingId: meeting._id.toString() },
      });
    }

    return NextResponse.json({ success: true, data: populatedMeeting }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
