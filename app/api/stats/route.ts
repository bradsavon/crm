import { NextResponse, NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contact from '@/models/Contact';
import Company from '@/models/Company';
import Case from '@/models/Case';
import Task from '@/models/Task';
import { getCurrentUser, hasPermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    await connectDB();
    
    const [contactsCount, companiesCount, casesCount, cases] = await Promise.all([
      Contact.countDocuments(),
      Company.countDocuments(),
      Case.countDocuments(),
      Case.find({}),
    ]);

    // Build task query - users see only their tasks unless admin/manager
    let taskQuery: any = {};
    if (currentUser && !hasPermission(currentUser, 'manager')) {
      taskQuery.assignedTo = currentUser.id;
    }

    let allTasks = 0;
    let pendingTasks = 0;
    let overdueTasks = 0;

    try {
      [allTasks, pendingTasks, overdueTasks] = await Promise.all([
        Task.countDocuments(taskQuery),
        Task.countDocuments({ ...taskQuery, status: { $in: ['pending', 'in-progress'] } }),
        Task.countDocuments({
          ...taskQuery,
          dueDate: { $lt: new Date() },
          status: { $ne: 'completed' },
        }),
      ]);
    } catch (taskError) {
      // Tasks collection might not exist yet, ignore
      console.log('Tasks not available:', taskError);
    }

    const totalCaseValue = cases.reduce((sum, case_) => sum + (case_.value || 0), 0);
    const wonCases = cases.filter(case_ => case_.stage === 'closed-won');
    const wonCaseValue = wonCases.reduce((sum, case_) => sum + (case_.value || 0), 0);
    const openCases = cases.filter(case_ => !case_.stage.startsWith('closed-'));
    const openCaseValue = openCases.reduce((sum, case_) => sum + (case_.value || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        contacts: contactsCount,
        companies: companiesCount,
        cases: casesCount,
        totalCaseValue,
        wonCaseValue,
        openCaseValue,
        wonCases: wonCases.length,
        openCases: openCases.length,
        tasks: allTasks,
        pendingTasks,
        overdueTasks,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

