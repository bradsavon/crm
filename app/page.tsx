'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  contacts: number;
  companies: number;
  cases: number;
  totalCaseValue: number;
  wonCaseValue: number;
  openCaseValue: number;
  wonCases: number;
  openCases: number;
  tasks: number;
  pendingTasks: number;
  overdueTasks: number;
}

interface MyTask {
  _id: string;
  title: string;
  priority: string;
  dueDate?: string;
  reminderDate?: string;
  status: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [myTasks, setMyTasks] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchMyTasks();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTasks = async () => {
    try {
      const res = await fetch('/api/tasks/my');
      const data = await res.json();
      if (data.success) {
        setMyTasks(data.data);
      }
    } catch (error) {
      console.error('Error fetching my tasks:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Welcome to your CRM system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Contacts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.contacts || 0}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <Link href="/contacts" className="text-blue-600 text-sm font-medium mt-4 inline-block hover:text-blue-700">
            View all →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Companies</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.companies || 0}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <Link href="/companies" className="text-green-600 text-sm font-medium mt-4 inline-block hover:text-green-700">
            View all →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Cases</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.openCases || 0}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <Link href="/cases" className="text-yellow-600 text-sm font-medium mt-4 inline-block hover:text-yellow-700">
            View all →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(stats?.wonCaseValue || 0)}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <Link href="/deals" className="text-purple-600 text-sm font-medium mt-4 inline-block hover:text-purple-700">
            View cases →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Pipeline Value</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Open Cases</span>
                <span className="font-semibold text-gray-900">{formatCurrency(stats?.openCaseValue || 0)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${stats && stats.totalCaseValue > 0 ? (stats.openCaseValue / stats.totalCaseValue) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Won Cases</span>
                <span className="font-semibold text-gray-900">{formatCurrency(stats?.wonCaseValue || 0)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${stats && stats.totalCaseValue > 0 ? (stats.wonCaseValue / stats.totalCaseValue) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">My Tasks</h2>
            {myTasks && myTasks.counts.overdue > 0 && (
              <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">
                {myTasks.counts.overdue} Overdue
              </span>
            )}
          </div>
          {myTasks && myTasks.counts.total > 0 ? (
            <div className="space-y-3">
              {myTasks.overdue.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-red-600 mb-2">⚠️ Overdue ({myTasks.overdue.length})</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {myTasks.overdue.slice(0, 3).map((task: MyTask) => (
                      <Link
                        key={task._id}
                        href={`/tasks/${task._id}`}
                        className="block p-2 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">{task.title}</div>
                        {task.dueDate && (
                          <div className="text-xs text-red-600 mt-1">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </Link>
                    ))}
                    {myTasks.overdue.length > 3 && (
                      <Link
                        href="/tasks?status=pending&filter=overdue"
                        className="block text-xs text-red-600 hover:text-red-700 text-center pt-1"
                      >
                        +{myTasks.overdue.length - 3} more...
                      </Link>
                    )}
                  </div>
                </div>
              )}
              {myTasks.dueToday.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-orange-600 mb-2">Due Today ({myTasks.dueToday.length})</h3>
                  <div className="space-y-2 max-h-24 overflow-y-auto">
                    {myTasks.dueToday.slice(0, 2).map((task: MyTask) => (
                      <Link
                        key={task._id}
                        href={`/tasks/${task._id}`}
                        className="block p-2 bg-orange-50 border border-orange-200 rounded hover:bg-orange-100 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">{task.title}</div>
                      </Link>
                    ))}
                    {myTasks.dueToday.length > 2 && (
                      <Link
                        href="/tasks?status=pending"
                        className="block text-xs text-orange-600 hover:text-orange-700 text-center pt-1"
                      >
                        +{myTasks.dueToday.length - 2} more...
                      </Link>
                    )}
                  </div>
                </div>
              )}
              {myTasks.dueTomorrow.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-yellow-600 mb-2">Due Tomorrow ({myTasks.dueTomorrow.length})</h3>
                  <div className="space-y-2 max-h-24 overflow-y-auto">
                    {myTasks.dueTomorrow.slice(0, 2).map((task: MyTask) => (
                      <Link
                        key={task._id}
                        href={`/tasks/${task._id}`}
                        className="block p-2 bg-yellow-50 border border-yellow-200 rounded hover:bg-yellow-100 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">{task.title}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {myTasks.overdue.length === 0 && myTasks.dueToday.length === 0 && myTasks.dueTomorrow.length === 0 && (
                <div className="space-y-2">
                  {myTasks.all.slice(0, 3).map((task: MyTask) => (
                    <Link
                      key={task._id}
                      href={`/tasks/${task._id}`}
                      className="block p-2 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900 line-clamp-1">{task.title}</div>
                      {task.dueDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
              <Link
                href="/tasks"
                className="block text-center bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors mt-4"
              >
                View All Tasks →
              </Link>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-4">No tasks assigned to you</p>
              <Link
                href="/tasks/new"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Create a task →
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Link
              href="/contacts/new"
              className="bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
            >
              Add Contact
            </Link>
            <Link
              href="/companies/new"
              className="bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors text-center"
            >
              Add Company
            </Link>
            <Link
              href="/cases/new"
              className="bg-yellow-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-yellow-700 transition-colors text-center"
            >
              Add Case
            </Link>
            <Link
              href="/tasks/new"
              className="bg-indigo-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-center"
            >
              Add Task
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

