import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contact from '@/models/Contact';
import { getCurrentUser } from '@/lib/auth';
import { createActivity } from '@/lib/activity';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    await connectDB();
    
    // If user is not admin/manager, filter by assignedTo
    let query: any = {};
    if (currentUser && currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      query.$or = [
        { assignedTo: currentUser.id },
        { createdBy: currentUser.id },
      ];
    }
    
    const contacts = await Contact.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: contacts });
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
    
    // Set createdBy and default assignedTo to current user if not specified
    const contactData = {
      ...body,
      createdBy: currentUser.id,
      assignedTo: body.assignedTo || currentUser.id,
    };
    
    const contact = await Contact.create(contactData);
    
    // Log activity
    await createActivity({
      type: 'created',
      entityType: 'contact',
      entityId: contact._id.toString(),
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      description: `Created contact: ${contact.firstName} ${contact.lastName}`,
    });

    const populatedContact = await Contact.findById(contact._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    return NextResponse.json({ success: true, data: populatedContact }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

