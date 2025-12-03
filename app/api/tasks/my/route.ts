import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
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
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get tasks assigned to current user
    const tasks = await Task.find({
      assignedTo: currentUser.id,
      status: { $in: ['pending', 'in-progress'] },
    })
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort({ dueDate: 1, priority: -1, createdAt: -1 });

    // Categorize tasks
    const overdue = tasks.filter(
      (task) => task.dueDate && new Date(task.dueDate) < now
    );
    const dueToday = tasks.filter(
      (task) =>
        task.dueDate &&
        new Date(task.dueDate).toDateString() === now.toDateString()
    );
    const dueTomorrow = tasks.filter(
      (task) =>
        task.dueDate &&
        new Date(task.dueDate) >= now &&
        new Date(task.dueDate) <= tomorrow &&
        new Date(task.dueDate).toDateString() !== now.toDateString()
    );
    const upcoming = tasks.filter(
      (task) =>
        task.dueDate &&
        new Date(task.dueDate) > tomorrow
    );
    const noDueDate = tasks.filter((task) => !task.dueDate);

    // Get tasks with reminders
    const tasksWithReminders = tasks.filter(
      (task) =>
        task.reminderDate &&
        new Date(task.reminderDate) <= now &&
        new Date(task.reminderDate) > new Date(now.getTime() - 24 * 60 * 60 * 1000) // Within last 24 hours
    );

    return NextResponse.json({
      success: true,
      data: {
        all: tasks,
        overdue,
        dueToday,
        dueTomorrow,
        upcoming,
        noDueDate,
        withReminders: tasksWithReminders,
        counts: {
          total: tasks.length,
          overdue: overdue.length,
          dueToday: dueToday.length,
          dueTomorrow: dueTomorrow.length,
          withReminders: tasksWithReminders.length,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

