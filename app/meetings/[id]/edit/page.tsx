'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Company {
  _id: string;
  name: string;
}

interface Case {
  _id: string;
  title: string;
}

export default function EditMeetingPage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    meetingType: 'in-person' as 'in-person' | 'video' | 'phone' | 'hybrid',
    videoLink: '',
    attendees: [] as string[],
    relatedEntityType: '',
    relatedEntityId: '',
    reminderMinutes: [] as number[],
  });

  useEffect(() => {
    fetchUsers();
    fetchMeeting();
  }, [meetingId]);

  useEffect(() => {
    // Fetch entities when type is selected
    if (formData.relatedEntityType) {
      fetchEntities(formData.relatedEntityType);
    } else {
      // Clear entity lists when type is cleared
      setContacts([]);
      setCompanies([]);
      setCases([]);
      setFormData((prev) => ({ ...prev, relatedEntityId: '' }));
    }
  }, [formData.relatedEntityType]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchEntities = async (entityType: string) => {
    try {
      const res = await fetch(`/api/${entityType}s`);
      const data = await res.json();
      if (data.success) {
        if (entityType === 'contact') {
          setContacts(data.data);
        } else if (entityType === 'company') {
          setCompanies(data.data);
        } else if (entityType === 'case') {
          setCases(data.data);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${entityType}s:`, error);
    }
  };

  const toLocalDateTimeString = (dateString?: string | Date) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const fetchMeeting = async () => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}`);
      const data = await res.json();
      if (data.success) {
        const meeting = data.data;
        setFormData({
          title: meeting.title || '',
          description: meeting.description || '',
          startTime: toLocalDateTimeString(meeting.startTime),
          endTime: toLocalDateTimeString(meeting.endTime),
          location: meeting.location || '',
          meetingType: meeting.meetingType || 'in-person',
          videoLink: meeting.videoLink || '',
          attendees: meeting.attendees?.map((a: any) => a._id) || [],
          relatedEntityType: meeting.relatedEntityType || '',
          relatedEntityId: meeting.relatedEntityId || '',
          reminderMinutes: meeting.reminderMinutes || [],
        });
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

  const calculateEndTime = (startTime: string): string => {
    if (!startTime) return '';
    const start = new Date(startTime);
    start.setMinutes(start.getMinutes() + 30);
    
    const year = start.getFullYear();
    const month = String(start.getMonth() + 1).padStart(2, '0');
    const day = String(start.getDate()).padStart(2, '0');
    const hours = String(start.getHours()).padStart(2, '0');
    const minutes = String(start.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Prepare data, excluding empty optional fields
      const meetingData: any = {
        title: formData.title,
        description: formData.description || undefined,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        location: formData.location || undefined,
        meetingType: formData.meetingType,
        videoLink: formData.videoLink || undefined,
        attendees: formData.attendees,
        reminderMinutes: formData.reminderMinutes,
      };

      // Only include relatedEntityType and relatedEntityId if they have values
      if (formData.relatedEntityType && formData.relatedEntityId) {
        meetingData.relatedEntityType = formData.relatedEntityType;
        meetingData.relatedEntityId = formData.relatedEntityId;
      }

      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingData),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/meetings/${meetingId}`);
      } else {
        setError(data.error || 'Failed to update meeting');
      }
    } catch (error) {
      console.error('Error updating meeting:', error);
      setError('Failed to update meeting');
    } finally {
      setSaving(false);
    }
  };

  const toggleAttendee = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      attendees: prev.attendees.includes(userId)
        ? prev.attendees.filter((id) => id !== userId)
        : [...prev.attendees, userId],
    }));
  };

  const toggleReminder = (minutes: number) => {
    setFormData((prev) => ({
      ...prev,
      reminderMinutes: prev.reminderMinutes.includes(minutes)
        ? prev.reminderMinutes.filter((m) => m !== minutes)
        : [...prev.reminderMinutes, minutes].sort((a, b) => a - b),
    }));
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Edit Meeting</h1>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6 max-w-3xl">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) => {
                  const newStartTime = e.target.value;
                  setFormData({
                    ...formData,
                    startTime: newStartTime,
                    // Auto-update end time to 30 minutes after start if end time is empty or was auto-calculated
                    endTime: formData.endTime && formData.endTime === calculateEndTime(formData.startTime)
                      ? calculateEndTime(newStartTime)
                      : formData.endTime || calculateEndTime(newStartTime),
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Type *
            </label>
            <select
              required
              value={formData.meetingType}
              onChange={(e) =>
                setFormData({ ...formData, meetingType: e.target.value as any })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="in-person">In-Person</option>
              <option value="video">Video Call</option>
              <option value="phone">Phone Call</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          {formData.meetingType === 'video' || formData.meetingType === 'hybrid' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Link
              </label>
              <input
                type="url"
                value={formData.videoLink}
                onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
                placeholder="https://meet.google.com/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attendees
            </label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
              {users.map((user) => (
                <label key={user._id} className="flex items-center space-x-2 py-2">
                  <input
                    type="checkbox"
                    checked={formData.attendees.includes(user._id)}
                    onChange={() => toggleAttendee(user._id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {user.firstName} {user.lastName} ({user.email})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link To (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Entity Type
                </label>
                <select
                  value={formData.relatedEntityType}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      relatedEntityType: e.target.value,
                      relatedEntityId: '', // Clear ID when type changes
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">None</option>
                  <option value="contact">Contact</option>
                  <option value="company">Company</option>
                  <option value="case">Case</option>
                </select>
              </div>
              {formData.relatedEntityType && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Select {formData.relatedEntityType.charAt(0).toUpperCase() + formData.relatedEntityType.slice(1)}
                  </label>
                  <select
                    value={formData.relatedEntityId}
                    onChange={(e) =>
                      setFormData({ ...formData, relatedEntityId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    {formData.relatedEntityType === 'contact' &&
                      contacts.map((contact) => (
                        <option key={contact._id} value={contact._id}>
                          {contact.firstName} {contact.lastName} {contact.email ? `(${contact.email})` : ''}
                        </option>
                      ))}
                    {formData.relatedEntityType === 'company' &&
                      companies.map((company) => (
                        <option key={company._id} value={company._id}>
                          {company.name}
                        </option>
                      ))}
                    {formData.relatedEntityType === 'case' &&
                      cases.map((case_) => (
                        <option key={case_._id} value={case_._id}>
                          {case_.title}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reminders
            </label>
            <div className="flex flex-wrap gap-2">
              {[5, 15, 30, 60, 1440].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => toggleReminder(minutes)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    formData.reminderMinutes.includes(minutes)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {minutes < 60
                    ? `${minutes} min`
                    : minutes === 1440
                    ? '1 day'
                    : `${minutes / 60} hour${minutes / 60 > 1 ? 's' : ''}`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Saving...' : 'Update Meeting'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

