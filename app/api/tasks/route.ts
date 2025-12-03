import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
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
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const priority = searchParams.get('priority');
    const relatedEntityType = searchParams.get('relatedEntityType');
    const relatedEntityId = searchParams.get('relatedEntityId');

    // Build query
    let query: any = {};

    // Users can only see their assigned tasks unless admin/manager
    if (!hasPermission(currentUser, 'manager')) {
      query.assignedTo = currentUser.id;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (relatedEntityType && relatedEntityId) {
      query.relatedEntityType = relatedEntityType;
      query.relatedEntityId = relatedEntityId;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort({ dueDate: 1, priority: -1, createdAt: -1 });

    return NextResponse.json({ success: true, data: tasks });
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

    // Set createdBy
    const taskData = {
      ...body,
      createdBy: currentUser.id,
      assignedTo: body.assignedTo || currentUser.id,
    };

    const task = await Task.create(taskData);

    // Log activity
    await createActivity({
      type: 'created',
      entityType: 'user',
      entityId: task.assignedTo.toString(),
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      description: `Created task: ${task.title}`,
      metadata: { taskId: task._id.toString(), priority: task.priority },
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    return NextResponse.json({ success: true, data: populatedTask }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

