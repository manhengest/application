import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { DateRangeFormatFunction } from 'react-big-calendar';
import { format, parse, startOfWeek, endOfWeek, getDay, isSameDay, addDays } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { api } from '../lib/api';
import { extractErrorMessage, isCancelError, type AppError } from '../lib/utils';
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
const formatTimeRange: DateRangeFormatFunction = ({ start, end }, culture, loc) => {
  const startLabel = loc ? loc.format(start, 'HH:mm', culture) : format(start, 'HH:mm');
  const endLabel = loc ? loc.format(end, 'HH:mm', culture) : format(end, 'HH:mm');
  return `${startLabel} - ${endLabel}`;
};

const calendarFormats = {
  dateFormat: 'd',
  timeGutterFormat: 'HH:mm',
  eventTimeRangeFormat: formatTimeRange,
  agendaTimeFormat: 'HH:mm',
  agendaTimeRangeFormat: formatTimeRange,
  selectRangeFormat: formatTimeRange,
};
const midnight = new Date();
midnight.setHours(0, 0, 0, 0);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: { eventId: string };
}

type CalendarView = 'month' | 'week';

const CustomEvent = ({ event }: { event: CalendarEvent }) => {
  return (
    <div className="text-sm truncate font-medium">
      {format(event.start, 'HH:mm')} - {event.title}
    </div>
  );
};

const eventPropGetter = () => {
  return {
    className: 'bg-indigo-50 text-indigo-600 border-0 rounded-md p-0.5 block',
  };
};

export function MyEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<CalendarView>('month');
  const [date, setDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const ac = new AbortController();
    void api
      .get<Event[]>('/users/me/events', { signal: ac.signal })
      .then((r) => setEvents(r.data))
      .catch((err: AppError) => {
        if (!isCancelError(err)) {
          setError(extractErrorMessage(err, 'Failed to load your events'));
        }
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
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

  const handleViewChange = (nextView: CalendarView) => {
    if (nextView === 'week') {
      setDate(new Date());
    }
    setView(nextView);
  };

  const handleNavigate = (action: 'PREV' | 'NEXT') => {
    if (view === 'month') {
      const newDate = new Date(date);
      newDate.setMonth(date.getMonth() + (action === 'NEXT' ? 1 : -1));
      setDate(newDate);
    } else {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() + (action === 'NEXT' ? 7 : -7));
      setDate(newDate);
    }
  };

  const handleSelectEvent = (ev: CalendarEvent) => {
    void navigate(`/events/${ev.resource.eventId}`, { state: { from: '/my-events' } });
  };

  const dayPropGetter = (cellDate: Date) => {
    if (cellDate.getMonth() !== date.getMonth() || cellDate.getFullYear() !== date.getFullYear()) {
      return { className: 'bg-gray-100' };
    }
    return {};
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const formattedDate =
    view === 'month'
      ? format(date, 'MMMM yyyy')
      : format(startOfWeek(date), 'MMM d') + ' - ' + format(endOfWeek(date), 'MMM d, yyyy');

  return (
    <div>
      {error && (
        <div className="mb-6 bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
      )}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Events</h1>
          <p className="text-gray-600">View and manage your event calendar</p>
        </div>
        <Link
          to="/events/create"
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-medium whitespace-nowrap"
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
            className="inline-block px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-medium"
          >
            Discover Events
          </Link>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleNavigate('PREV')}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
                aria-label="Previous"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-gray-900 min-w-[140px] text-center">
                {formattedDate}
              </h2>
              <button
                onClick={() => handleNavigate('NEXT')}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
                aria-label="Next"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleViewChange('month')}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${
                  view === 'month'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => handleViewChange('week')}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${
                  view === 'week'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Week
              </button>
            </div>
          </div>
          {view === 'week' ? (
            <div className="grid grid-cols-7 gap-4 min-h-[150px]">
              {Array.from({ length: 7 }).map((_, i) => {
                const day = addDays(startOfWeek(date), i);
                const dayEvents = calendarEvents
                  .filter((e) => isSameDay(e.start, day))
                  .sort((a, b) => a.start.getTime() - b.start.getTime());
                const isTodayDay = isSameDay(day, new Date());

                return (
                  <div
                    key={day.toISOString()}
                    className={`flex flex-col bg-white rounded-xl p-4 overflow-y-auto ${
                      isTodayDay ? 'border-2 border-indigo-500' : 'border border-gray-200'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{format(day, 'EEE')}</div>
                    <div className="text-gray-600 mb-4">{format(day, 'd')}</div>

                    <div className="flex-1 flex flex-col gap-2">
                      {dayEvents.length === 0 ? (
                        <span className="text-sm text-gray-500">No events</span>
                      ) : (
                        dayEvents.map((ev) => (
                          <div
                            key={ev.id}
                            onClick={() => handleSelectEvent(ev)}
                            className="bg-indigo-50 rounded-lg p-2 text-indigo-700 cursor-pointer hover:bg-indigo-100 transition-colors"
                          >
                            <div className="text-xs font-semibold mb-1">
                              {format(ev.start, 'HH:mm')}
                            </div>
                            <div
                              className="text-sm font-medium leading-tight truncate"
                              title={ev.title}
                            >
                              {ev.title}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[700px]">
              <Calendar
                localizer={localizer}
                formats={calendarFormats}
                events={calendarEvents}
                showAllEvents
                view="month"
                drilldownView={null}
                date={date}
                onNavigate={setDate}
                onSelectEvent={handleSelectEvent}
                startAccessor="start"
                endAccessor="end"
                scrollToTime={midnight}
                toolbar={false}
                eventPropGetter={eventPropGetter}
                dayPropGetter={dayPropGetter}
                components={{
                  event: CustomEvent,
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
