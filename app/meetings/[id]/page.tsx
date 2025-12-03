'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Meeting {
  _id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingType: 'in-person' | 'video' | 'phone' | 'hybrid';
  videoLink?: string;
  organizer: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  attendees: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  relatedEntityType?: 'contact' | 'company' | 'case';
  relatedEntityId?: string;
  relatedEntityName?: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function MeetingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCurrentUser();
    fetchMeeting();
  }, [meetingId]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.data);
      }
    } catch (error) {
      router.push('/login');
    }
  };

  const fetchMeeting = async () => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}`);
      const data = await res.json();
      if (data.success) {
        setMeeting(data.data);
      } else {
        setError(data.error || 'Failed to load meeting');
      }
    } catch (error) {
      console.error('Error fetching meeting:', error);
      setError('Failed to load meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to cancel this meeting?')) return;

    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        router.push('/calendar');
      } else {
        setError(data.error || 'Failed to delete meeting');
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
      setError('Failed to delete meeting');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error || !meeting) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Meeting not found'}</p>
        <Link href="/calendar" className="text-blue-600 hover:text-blue-700">
          Back to Calendar
        </Link>
      </div>
    );
  }

  const isOrganizer = currentUser?.id === meeting.organizer._id;
  const canEdit = isOrganizer;

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{meeting.title}</h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
              {formatDateTime(meeting.startTime)} - {new Date(meeting.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
          {canEdit && (
            <div className="flex gap-3">
              <Link
                href={`/meetings/${meetingId}/edit`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Cancel Meeting
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
            {meeting.description && (
              <div className="mb-4">
                <p className="text-gray-700 whitespace-pre-wrap">{meeting.description}</p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Start Time:</span>
                <p className="text-gray-900">{formatDateTime(meeting.startTime)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">End Time:</span>
                <p className="text-gray-900">{formatDateTime(meeting.endTime)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Meeting Type:</span>
                <p className="text-gray-900 capitalize">{meeting.meetingType}</p>
              </div>
              {meeting.location && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Location:</span>
                  <p className="text-gray-900">{meeting.location}</p>
                </div>
              )}
              {meeting.videoLink && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Video Link:</span>
                  <a
                    href={meeting.videoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {meeting.videoLink}
                  </a>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-500">Status:</span>
                <p className="text-gray-900 capitalize">{meeting.status}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Organizer</h2>
            <p className="text-gray-900">
              {meeting.organizer.firstName} {meeting.organizer.lastName}
            </p>
            <p className="text-sm text-gray-500">{meeting.organizer.email}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Attendees ({meeting.attendees.length})
            </h2>
            <div className="space-y-2">
              {meeting.attendees.map((attendee) => (
                <div key={attendee._id}>
                  <p className="text-gray-900">
                    {attendee.firstName} {attendee.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{attendee.email}</p>
                </div>
              ))}
            </div>
          </div>

          {meeting.relatedEntityType && meeting.relatedEntityId && (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Related To</h2>
              <Link
                href={`/${meeting.relatedEntityType}s/${meeting.relatedEntityId}`}
                className="text-blue-600 hover:text-blue-700"
              >
                {meeting.relatedEntityName ? (
                  <span>
                    <span className="capitalize">{meeting.relatedEntityType}</span>: {meeting.relatedEntityName}
                  </span>
                ) : (
                  <span className="capitalize">{meeting.relatedEntityType} →</span>
                )}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

