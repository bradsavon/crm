'use client';

import { useState, useEffect } from 'react';

interface Availability {
  _id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const res = await fetch('/api/availability');
      const data = await res.json();
      if (data.success) {
        // Initialize with all days if none exist
        const existing = data.data;
        const allDays = daysOfWeek.map((day) => {
          const existingDay = existing.find((a: Availability) => a.dayOfWeek === day.value);
          return existingDay || {
            dayOfWeek: day.value,
            startTime: '09:00',
            endTime: '17:00',
            isAvailable: true,
          };
        });
        setAvailability(allDays);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDay = (dayOfWeek: number, updates: Partial<Availability>) => {
    setAvailability((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...updates } : day
      )
    );
  };

  const saveAvailability = async () => {
    setSaving(true);
    setMessage('');

    try {
      const promises = availability.map((day) =>
        fetch('/api/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(day),
        })
      );

      const results = await Promise.all(promises);
      const allSuccess = results.every((res) => {
        const data = res.json();
        return data.then((d: any) => d.success);
      });

      if (allSuccess) {
        setMessage('Availability saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error saving some availability settings');
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      setMessage('Error saving availability');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Availability Settings</h1>
        <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
          Set your weekly availability for meeting scheduling
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded ${
              message.includes('Error')
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-green-50 border border-green-200 text-green-700'
            }`}
          >
            {message}
          </div>
        )}

        <div className="space-y-4">
          {daysOfWeek.map((day) => {
            const dayAvailability = availability.find((a) => a.dayOfWeek === day.value);
            if (!dayAvailability) return null;

            return (
              <div
                key={day.value}
                className="border border-gray-200 rounded-lg p-4 sm:p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{day.label}</h3>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={dayAvailability.isAvailable}
                      onChange={(e) =>
                        updateDay(day.value, { isAvailable: e.target.checked })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Available</span>
                  </label>
                </div>

                {dayAvailability.isAvailable && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={dayAvailability.startTime}
                        onChange={(e) =>
                          updateDay(day.value, { startTime: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={dayAvailability.endTime}
                        onChange={(e) =>
                          updateDay(day.value, { endTime: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={saveAvailability}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? 'Saving...' : 'Save Availability'}
          </button>
        </div>
      </div>
    </div>
  );
}

