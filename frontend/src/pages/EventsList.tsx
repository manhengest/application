import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { extractErrorMessage, isCancelError, type AppError } from '../lib/utils';
import type { Event } from '../types';
import { format } from 'date-fns';
import { useOptimisticParticipationList } from '../hooks/useOptimisticParticipation';
import { EventTagChip } from '../components/EventTagChip';
import { SearchInput } from '../components/ui/SearchInput';
import { ErrorAlert } from '../components/ui/ErrorAlert';

export function EventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagOptions, setTagOptions] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState('');
  const [tagError, setTagError] = useState('');
  const [actionError, setActionError] = useState('');
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { handleJoin, handleLeave, isPending } = useOptimisticParticipationList({
    events,
    setEvents,
    setError: (msg) => setActionError(msg),
    onNavigateToLogin: () => void navigate('/login'),
    user,
  });

  useEffect(() => {
    const ac = new AbortController();
    void api
      .get<{ id: string; name: string }[]>('/tags', { signal: ac.signal })
      .then((r) => setTagOptions(r.data))
      .catch((err: AppError) => {
        if (!isCancelError(err)) {
          setTagError(extractErrorMessage(err, 'Failed to load tags'));
        }
      });
    return () => ac.abort();
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    queueMicrotask(() => setLoading(true));
    const params =
      selectedTags.length > 0
        ? { params: { tags: selectedTags } }
        : {};
    void api
      .get<Event[]>('/events', { signal: ac.signal, ...params })
      .then((r) => setEvents(r.data))
      .catch((err: AppError) => {
        if (!isCancelError(err)) {
          setError(extractErrorMessage(err, 'Failed to load events'));
        }
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [selectedTags]);

  const filtered = events.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Events</h1>
      <p className="text-gray-600 mb-6">Find and join exciting events happening around you</p>
      {(error || tagError || actionError) && (
        <div className="mb-6">
          <ErrorAlert message={error || tagError || actionError} />
        </div>
      )}
      <div className="space-y-4 mb-8">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search events..."
        />
        {tagOptions.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-gray-700">Filter by tag:</span>
            {tagOptions.map((t) => {
              const isSelected = selectedTags.includes(t.name);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setSelectedTags((prev) =>
                      isSelected ? prev.filter((x) => x !== t.name) : [...prev, t.name],
                    )
                  }
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.name}
                </button>
              );
            })}
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                className="text-sm text-indigo-600 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((ev) => {
          const pending = isPending(ev.id);
          return (
            <Link
              key={ev.id}
              to={`/events/${ev.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-2">{ev.title}</h2>
              {ev.tags && ev.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {ev.tags.map((tag) => (
                    <EventTagChip key={tag.id} tag={tag} compact />
                  ))}
                </div>
              )}
              <p className="text-gray-600 text-sm mb-6 line-clamp-2">{ev.description}</p>
              <div className="space-y-3 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4v4M3 21h18M5 21V7a2 2 0 012-2h10a2 2 0 012 2v14"
                    />
                  </svg>
                  {format(new Date(ev.date), 'MMM d, yyyy')}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {format(new Date(ev.date), 'HH:mm')}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {ev.location}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
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
                        disabled={pending}
                        className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {pending ? 'Joining...' : 'Leave Event'}
                      </button>
                    ) : !ev.isFull ? (
                      <button
                        onClick={(e) => handleJoin(e, ev.id)}
                        disabled={pending}
                        className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {pending ? 'Leaving...' : 'Join Event'}
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
        <p className="text-center text-gray-500 py-12">
          {selectedTags.length > 0
            ? 'No events match the selected tags.'
            : 'No events found.'}
        </p>
      )}
    </div>
  );
}
