import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { extractErrorMessage, isCancelError, type AppError } from '../lib/utils';
import type { Event, LocationState } from '../types';
import { format } from 'date-fns';
import { ConfirmModal } from '../components/ConfirmModal';
import { useOptimisticParticipationSingle } from '../hooks/useOptimisticParticipation';

export function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const { from: fromState } = (location.state ?? {}) as LocationState;
  const backTo = typeof fromState === 'string' ? fromState : '/events';

  const { handleJoin, handleLeave, pending } = useOptimisticParticipationSingle({
    event,
    setEvent,
    eventId: id,
    setError,
    onNavigateToLogin: () => void navigate('/login'),
    user,
  });

  useEffect(() => {
    if (!id) return;
    const ac = new AbortController();
    void api
      .get<Event>(`/events/${id}`, { signal: ac.signal })
      .then((r) => setEvent(r.data))
      .catch((err: AppError) => {
        if (!isCancelError(err)) {
          setEvent(null);
          setError(extractErrorMessage(err, 'Failed to load event'));
        }
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [id]);

  const handleDelete = async () => {
    setError('');
    try {
      await api.delete(`/events/${id}`);
      void navigate('/events');
    } catch (err) {
      setError(extractErrorMessage(err as AppError, 'Failed to delete event'));
    } finally {
      setDeleteModal(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }
  if (!event) {
    return (
      <div className="text-center py-12">
        {error && (
          <div className="mb-4 bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm max-w-md mx-auto">
            {error}
          </div>
        )}
        <p className="text-gray-500">Event not found.</p>
        <Link to={backTo} className="text-indigo-600 hover:underline mt-2 inline-block">
          Back to events
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Link
        to={backTo}
        className="text-indigo-600 hover:underline mb-4 inline-flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {error && (
          <div className="mb-4 bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
        )}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h1>
        <p className="text-gray-600 mb-6">{event.description}</p>
        <div className="space-y-2 text-gray-600 mb-6">
          <p>
            <span className="font-medium">Date & time:</span>{' '}
            {format(new Date(event.date), 'MMM d, yyyy HH:mm')}
          </p>
          <p>
            <span className="font-medium">Location:</span> {event.location}
          </p>
          <p>
            <span className="font-medium">Capacity:</span> {event.capacity ?? 'Unlimited'}
          </p>
          <p>
            <span className="font-medium">Participants:</span> {event.participantCount}
            {event.capacity != null && ` / ${event.capacity}`}
          </p>
        </div>
        {event.participants && event.participants.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-2">Participants</h2>
            <div className="flex flex-wrap gap-2">
              {event.participants.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600"
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {event.isOrganizer && (
            <>
              <Link
                to={`/events/${id}/edit`}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                Edit
              </Link>
              <button
                onClick={() => setDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete
              </button>
            </>
          )}
          {!event.isExpired &&
            (user ? (
              event.isJoined ? (
                <button
                  onClick={handleLeave}
                  disabled={pending}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {pending ? 'Joining...' : 'Leave'}
                </button>
              ) : !event.isFull ? (
                <button
                  onClick={handleJoin}
                  disabled={pending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {pending ? 'Leaving...' : 'Join Event'}
                </button>
              ) : null
            ) : !event.isFull ? (
              <button
                onClick={() => void navigate('/login')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Join Event
              </button>
            ) : null)}
        </div>
      </div>
      <ConfirmModal
        open={deleteModal}
        title="Delete event"
        message="Are you sure you want to delete this event?"
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteModal(false)}
      />
    </div>
  );
}
