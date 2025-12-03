import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contact from '@/models/Contact';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { createActivity } from '@/lib/activity';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request);
    await connectDB();
    
    const contact = await Contact.findById(params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');
      
    if (!contact) {
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
    }

    // Check permissions - users can only view their assigned contacts unless admin/manager
    if (currentUser && !hasPermission(currentUser, 'manager')) {
      const contactObj = contact.toObject();
      if (contactObj.assignedTo?._id?.toString() !== currentUser.id && 
          contactObj.createdBy?._id?.toString() !== currentUser.id) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ success: true, data: contact });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();
    const existingContact = await Contact.findById(params.id);
    if (!existingContact) {
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
    }

    // Check permissions
    const contactObj = existingContact.toObject();
    if (!hasPermission(currentUser, 'manager')) {
      if (contactObj.assignedTo?.toString() !== currentUser.id && 
          contactObj.createdBy?.toString() !== currentUser.id) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const contact = await Contact.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    // Log activity
    const activityType = body.assignedTo && body.assignedTo !== existingContact.assignedTo?.toString()
      ? 'assigned'
      : 'updated';
    
    await createActivity({
      type: activityType,
      entityType: 'contact',
      entityId: contact!._id.toString(),
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      description: activityType === 'assigned'
        ? `Assigned contact: ${contact!.firstName} ${contact!.lastName}`
        : `Updated contact: ${contact!.firstName} ${contact!.lastName}`,
      metadata: activityType === 'assigned' ? { assignedTo: body.assignedTo } : undefined,
    });

    return NextResponse.json({ success: true, data: contact });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();
    const contact = await Contact.findById(params.id);
    if (!contact) {
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
    }

    // Only admin/manager or creator can delete
    if (!hasPermission(currentUser, 'manager')) {
      const contactObj = contact.toObject();
      if (contactObj.createdBy?.toString() !== currentUser.id) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    await Contact.findByIdAndDelete(params.id);

    // Log activity
    await createActivity({
      type: 'deleted',
      entityType: 'contact',
      entityId: params.id,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      description: `Deleted contact: ${contact.firstName} ${contact.lastName}`,
    });

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

