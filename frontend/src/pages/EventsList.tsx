import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { extractErrorMessage, isCancelError, type AppError } from '../lib/utils';
import type { Event } from '../types';
import { format } from 'date-fns';

export function EventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [pendingEventIds, setPendingEventIds] = useState<string[]>([]);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    const ac = new AbortController();
    void api
      .get<Event[]>('/events', { signal: ac.signal })
      .then((r) => setEvents(r.data))
      .catch((err: AppError) => {
        if (!isCancelError(err)) {
          setError(extractErrorMessage(err, 'Failed to load events'));
        }
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, []);

  const filtered = events.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase())
  );

  const updateParticipation = (event: Event, isJoined: boolean): Event => {
    if ((event.isJoined ?? false) === isJoined) {
      return event;
    }
    const participantCount = Math.max(0, event.participantCount + (isJoined ? 1 : -1));
    const isFull = event.capacity !== null ? participantCount >= event.capacity : false;

    return {
      ...event,
      isJoined,
      participantCount,
      isFull,
    };
  };

  const handleJoin = async (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      void navigate('/login');
      return;
    }
    if (pendingEventIds.includes(eventId)) {
      return;
    }
    setActionError('');
    const previousEvent = events.find((ev) => ev.id === eventId);
    if (!previousEvent) {
      return;
    }
    setPendingEventIds((prev) => [...prev, eventId]);
    setEvents((prev) => prev.map((ev) => (ev.id === eventId ? updateParticipation(ev, true) : ev)));

    try {
      await api.post<Event>(`/events/${eventId}/join`);
    } catch (err) {
      setEvents((prev) => prev.map((ev) => (ev.id === eventId ? previousEvent : ev)));
      setActionError(extractErrorMessage(err as AppError, 'Failed to join event'));
    } finally {
      setPendingEventIds((prev) => prev.filter((id) => id !== eventId));
    }
  };

  const handleLeave = async (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (pendingEventIds.includes(eventId)) {
      return;
    }
    setActionError('');
    const previousEvent = events.find((ev) => ev.id === eventId);
    if (!previousEvent) {
      return;
    }
    setPendingEventIds((prev) => [...prev, eventId]);
    setEvents((prev) => prev.map((ev) => (ev.id === eventId ? updateParticipation(ev, false) : ev)));

    try {
      await api.post<Event>(`/events/${eventId}/leave`);
    } catch (err) {
      setEvents((prev) => prev.map((ev) => (ev.id === eventId ? previousEvent : ev)));
      setActionError(extractErrorMessage(err as AppError, 'Failed to leave event'));
    } finally {
      setPendingEventIds((prev) => prev.filter((id) => id !== eventId));
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Events</h1>
      <p className="text-gray-600 mb-6">Find and join exciting events happening around you</p>
      {(error || actionError) && (
        <div className="mb-6 bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error || actionError}
        </div>
      )}
      <div className="relative mb-8">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((ev) => {
          const isPending = pendingEventIds.includes(ev.id);
          return (
            <Link
            key={ev.id}
            to={`/events/${ev.id}`}
            className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-3">{ev.title}</h2>
            <p className="text-gray-600 text-sm mb-6 line-clamp-2">{ev.description}</p>
            <div className="space-y-3 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4v4M3 21h18M5 21V7a2 2 0 012-2h10a2 2 0 012 2v14" />
                </svg>
                {format(new Date(ev.date), 'MMM d, yyyy')}
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {format(new Date(ev.date), 'HH:mm')}
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {ev.location}
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {ev.participantCount}/{ev.capacity ?? '∞'} participants
              </div>
            </div>
            <hr className="my-5 border-gray-200" />
            <div className="flex flex-col gap-2">
              {ev.isFull && !ev.isJoined && (
                <span className="w-full text-center px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                  Full
                </span>
              )}
              {ev.isExpired && (
                <span className="w-full text-center px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                  Expired
                </span>
              )}
              {!ev.isExpired &&
                (user ? (
                  ev.isJoined ? (
                    <button
                      onClick={(e) => handleLeave(e, ev.id)}
                      disabled={isPending}
                      className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isPending ? 'Leaving...' : 'Leave Event'}
                    </button>
                  ) : !ev.isFull ? (
                    <button
                      onClick={(e) => handleJoin(e, ev.id)}
                      disabled={isPending}
                      className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isPending ? 'Joining...' : 'Join Event'}
                    </button>
                  ) : null
                ) : !ev.isFull ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      void navigate('/login');
                    }}
                    className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                  >
                    Join Event
                  </button>
                ) : null)}
            </div>
          </Link>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-gray-500 py-12">No events found.</p>
      )}
    </div>
  );
}
