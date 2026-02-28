import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { api } from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';
import type { Event } from '../types';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: { eventId: string };
}

export function MyEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<Event[]>('/users/me/events')
      .then((r) => setEvents(r.data))
      .finally(() => setLoading(false));
  }, []);

  const calendarEvents: CalendarEvent[] = events.map((e) => {
    const start = new Date(e.date);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return {
      id: e.id,
      title: e.title,
      start,
      end,
      resource: { eventId: e.id },
    };
  });

  const handleSelectEvent = (ev: CalendarEvent) => {
    navigate(`/events/${ev.resource.eventId}`);
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">My Events</h1>
      <p className="text-gray-600 mb-6">View and manage your event calendar</p>
      <div className="mb-4 flex justify-end">
        <Link
          to="/events/create"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
        >
          + Create Event
        </Link>
      </div>
      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-600 mb-4">
            You are not part of any events yet. Explore public events and join.
          </p>
          <Link
            to="/events"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Discover Events
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded-lg font-medium ${
                view === 'month' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded-lg font-medium ${
                view === 'week' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
          </div>
          <div className="h-[500px]">
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectEvent={handleSelectEvent}
              startAccessor="start"
              endAccessor="end"
            />
          </div>
        </div>
      )}
    </div>
  );
}
