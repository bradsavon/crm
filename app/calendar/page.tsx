'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Import FullCalendar components
let FullCalendar: any;
let dayGridPlugin: any;
let timeGridPlugin: any;
let interactionPlugin: any;

if (typeof window !== 'undefined') {
  FullCalendar = require('@fullcalendar/react').default;
  dayGridPlugin = require('@fullcalendar/daygrid').default;
  timeGridPlugin = require('@fullcalendar/timegrid').default;
  interactionPlugin = require('@fullcalendar/interaction').default;
}

interface Meeting {
  _id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingType: 'in-person' | 'video' | 'phone' | 'hybrid';
  organizer: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  attendees: Array<{
    _id: string;
    firstName: string;
    lastName: string;
  }>;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
}

interface Task {
  _id: string;
  title: string;
  dueDate?: string;
  status: string;
  priority: string;
}

export default function CalendarPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetchMeetings();
    fetchTasks();
  }, [currentDate]);

  const fetchMeetings = async () => {
    try {
      const start = new Date(currentDate);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(currentDate);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);

      const res = await fetch(
        `/api/meetings?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      const data = await res.json();
      if (data.success) {
        setMeetings(data.data);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks/my');
      const data = await res.json();
      if (data.success) {
        setTasks(data.data.all || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const formatEvents = () => {
    const events: any[] = [];

    // Add meetings
    meetings.forEach((meeting) => {
      events.push({
        id: `meeting-${meeting._id}`,
        title: meeting.title,
        start: meeting.startTime,
        end: meeting.endTime,
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        extendedProps: {
          type: 'meeting',
          meeting,
        },
      });
    });

    // Add tasks with due dates
    tasks.forEach((task) => {
      if (task.dueDate && task.status !== 'completed') {
        const dueDate = new Date(task.dueDate);
        const priorityColors: Record<string, string> = {
          urgent: '#ef4444',
          high: '#f59e0b',
          medium: '#3b82f6',
          low: '#6b7280',
        };

        events.push({
          id: `task-${task._id}`,
          title: `📋 ${task.title}`,
          start: dueDate,
          allDay: true,
          backgroundColor: priorityColors[task.priority] || '#6b7280',
          borderColor: priorityColors[task.priority] || '#6b7280',
          extendedProps: {
            type: 'task',
            task,
          },
        });
      }
    });

    return events;
  };

  const handleDateClick = (arg: any) => {
    // Navigate to create meeting page with pre-filled date and time
    const clickedDate = arg.date;
    const year = clickedDate.getFullYear();
    const month = String(clickedDate.getMonth() + 1).padStart(2, '0');
    const day = String(clickedDate.getDate()).padStart(2, '0');
    const hours = String(clickedDate.getHours()).padStart(2, '0');
    const minutes = String(clickedDate.getMinutes()).padStart(2, '0');
    
    // Format as datetime-local string: YYYY-MM-DDTHH:mm
    const startDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // Calculate end time (30 minutes later)
    const endDate = new Date(clickedDate);
    endDate.setMinutes(endDate.getMinutes() + 30);
    const endYear = endDate.getFullYear();
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDate.getDate()).padStart(2, '0');
    const endHours = String(endDate.getHours()).padStart(2, '0');
    const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
    const endDateTime = `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}`;
    
    window.location.href = `/meetings/new?start=${encodeURIComponent(startDateTime)}&end=${encodeURIComponent(endDateTime)}`;
  };

  const handleEventClick = (arg: any) => {
    const { type, meeting, task } = arg.event.extendedProps;
    if (type === 'meeting') {
      window.location.href = `/meetings/${meeting._id}`;
    } else if (type === 'task') {
      window.location.href = `/tasks/${task._id}`;
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading calendar...</div>;
  }

  if (!isClient || !FullCalendar) {
    return <div className="text-center py-12">Loading calendar...</div>;
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
              View meetings and tasks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/settings/availability"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Availability
            </Link>
            <Link
              href="/meetings/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Schedule Meeting
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setView('dayGridMonth')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'dayGridMonth'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView('timeGridWeek')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'timeGridWeek'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setView('timeGridDay')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'timeGridDay'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Day
          </button>
        </div>

        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={formatEvents()}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          editable={false}
          selectable={true}
          height="auto"
          eventDisplay="block"
        />
      </div>
    </div>
  );
}
