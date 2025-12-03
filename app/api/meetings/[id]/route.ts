import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Meeting from '@/models/Meeting';
import Contact from '@/models/Contact';
import Company from '@/models/Company';
import Case from '@/models/Case';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { createActivity } from '@/lib/activity';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();
    const meeting = await Meeting.findById(params.id)
      .populate('organizer', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email');

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Fetch related entity name if linked
    let relatedEntityName = null;
    if (meeting.relatedEntityType && meeting.relatedEntityId) {
      try {
        if (meeting.relatedEntityType === 'contact') {
          const contact = await Contact.findById(meeting.relatedEntityId);
          if (contact) {
            relatedEntityName = `${contact.firstName} ${contact.lastName}`;
          }
        } else if (meeting.relatedEntityType === 'company') {
          const company = await Company.findById(meeting.relatedEntityId);
          if (company) {
            relatedEntityName = company.name;
          }
        } else if (meeting.relatedEntityType === 'case') {
          const case_ = await Case.findById(meeting.relatedEntityId);
          if (case_) {
            relatedEntityName = case_.title;
          }
        }
      } catch (error) {
        // Entity might not exist, continue without name
        console.error(`Error fetching ${meeting.relatedEntityType} ${meeting.relatedEntityId}:`, error);
      }
    }

    const meetingObj = meeting.toObject();
    if (relatedEntityName) {
      meetingObj.relatedEntityName = relatedEntityName;
    }

    // Check permissions - users can only view meetings they're part of unless admin/manager
    if (!hasPermission(currentUser, 'manager')) {
      const isOrganizer = meetingObj.organizer._id.toString() === currentUser.id;
      const isAttendee = meetingObj.attendees.some(
        (a: any) => a._id.toString() === currentUser.id
      );
      
      if (!isOrganizer && !isAttendee) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ success: true, data: meetingObj });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();
    const meeting = await Meeting.findById(params.id);

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Check permissions - only organizer or admin/manager can edit
    const meetingObj = meeting.toObject();
    const isOrganizer = meetingObj.organizer.toString() === currentUser.id;
    
    if (!isOrganizer && !hasPermission(currentUser, 'manager')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate end time if both are being updated
    if (body.startTime && body.endTime) {
      if (new Date(body.endTime) <= new Date(body.startTime)) {
        return NextResponse.json(
          { success: false, error: 'End time must be after start time' },
          { status: 400 }
        );
      }
    }

    // Update meeting
    Object.assign(meeting, body);
    await meeting.save();

    const updatedMeeting = await Meeting.findById(meeting._id)
      .populate('organizer', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email');

    // Log activity
    if (meeting.relatedEntityType && meeting.relatedEntityId) {
      await createActivity({
        type: 'updated',
        entityType: meeting.relatedEntityType as 'contact' | 'company' | 'case',
        entityId: meeting.relatedEntityId,
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        description: `Updated meeting: ${meeting.title}`,
        metadata: { meetingId: meeting._id.toString() },
      });
    }

    return NextResponse.json({ success: true, data: updatedMeeting });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();
    const meeting = await Meeting.findById(params.id);

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Check permissions - only organizer or admin/manager can delete
    const meetingObj = meeting.toObject();
    const isOrganizer = meetingObj.organizer.toString() === currentUser.id;
    
    if (!isOrganizer && !hasPermission(currentUser, 'manager')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Log activity before deletion
    if (meeting.relatedEntityType && meeting.relatedEntityId) {
      await createActivity({
        type: 'deleted',
        entityType: meeting.relatedEntityType as 'contact' | 'company' | 'case',
        entityId: meeting.relatedEntityId,
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        description: `Cancelled meeting: ${meeting.title}`,
        metadata: { meetingId: meeting._id.toString() },
      });
    }

    await Meeting.findByIdAndDelete(params.id);

    return NextResponse.json({ success: true, message: 'Meeting deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
