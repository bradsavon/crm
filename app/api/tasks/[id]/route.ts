import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
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
    const task = await Task.findById(params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check permissions - users can only view their assigned tasks unless admin/manager
    if (!hasPermission(currentUser, 'manager')) {
      const taskObj = task.toObject();
      if (taskObj.assignedTo._id.toString() !== currentUser.id) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ success: true, data: task });
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
    const existingTask = await Task.findById(params.id);
    
    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const taskObj = existingTask.toObject();
    if (!hasPermission(currentUser, 'manager')) {
      if (taskObj.assignedTo.toString() !== currentUser.id && 
          taskObj.createdBy.toString() !== currentUser.id) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const task = await Task.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    // Log activity
    const activityType = body.assignedTo && body.assignedTo !== existingTask.assignedTo?.toString()
      ? 'assigned'
      : body.status === 'completed' && existingTask.status !== 'completed'
      ? 'updated'
      : 'updated';

    await createActivity({
      type: activityType,
      entityType: 'user',
      entityId: task!.assignedTo.toString(),
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      description: activityType === 'assigned'
        ? `Assigned task: ${task!.title}`
        : task!.status === 'completed'
        ? `Completed task: ${task!.title}`
        : `Updated task: ${task!.title}`,
      metadata: { taskId: task!._id.toString() },
    });

    return NextResponse.json({ success: true, data: task });
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
    const task = await Task.findById(params.id);
    
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Only creator or admin/manager can delete
    const taskObj = task.toObject();
    if (!hasPermission(currentUser, 'manager')) {
      if (taskObj.createdBy.toString() !== currentUser.id) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    await Task.findByIdAndDelete(params.id);

    // Log activity
    await createActivity({
      type: 'deleted',
      entityType: 'user',
      entityId: task.assignedTo.toString(),
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      description: `Deleted task: ${task.title}`,
    });

    return NextResponse.json({ success: true, message: 'Task deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

