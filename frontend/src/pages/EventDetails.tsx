import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { extractErrorMessage } from '../lib/utils';
import type { Event } from '../types';
import { format } from 'date-fns';
import { ConfirmModal } from '../components/ConfirmModal';

export function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const ac = new AbortController();
    api
      .get<Event>(`/events/${id}`, { signal: ac.signal })
      .then((r) => setEvent(r.data))
      .catch((err) => {
        if (err.name !== 'CanceledError') {
          setEvent(null);
          setError(extractErrorMessage(err, 'Failed to load event'));
        }
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [id]);

  const handleJoin = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setError('');
    try {
      const { data } = await api.post<Event>(`/events/${id}/join`);
      setEvent(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to join event'));
    }
  };

  const handleLeave = async () => {
    setError('');
    try {
      const { data } = await api.post<Event>(`/events/${id}/leave`);
      setEvent(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to leave event'));
    }
  };

  const handleDelete = async () => {
    setError('');
    try {
      await api.delete(`/events/${id}`);
      navigate('/events');
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to delete event'));
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
        <Link to="/events" className="text-indigo-600 hover:underline mt-2 inline-block">
          Back to events
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Link to="/events" className="text-indigo-600 hover:underline mb-4 inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {error && (
          <div className="mb-4 bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h1>
        <p className="text-gray-600 mb-6">{event.description}</p>
        <div className="space-y-2 text-gray-600 mb-6">
          <p>
            <span className="font-medium">Date & time:</span>{' '}
            {format(new Date(event.date), 'PPp')}
          </p>
          <p>
            <span className="font-medium">Location:</span> {event.location}
          </p>
          <p>
            <span className="font-medium">Capacity:</span>{' '}
            {event.capacity ?? 'Unlimited'}
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
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                  title={p.name}
                >
                  <span className="font-medium">{p.initials}</span>
                  <span className="text-gray-600">{p.name}</span>
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
          {!event.isOrganizer && !event.isFull && !event.isExpired && (
            user ? (
              event.isJoined ? (
                <button
                  onClick={handleLeave}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Leave
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Join Event
                </button>
              )
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Join Event
              </button>
            )
          )}
        </div>
      </div>
      <ConfirmModal
        open={deleteModal}
        title="Delete event"
        message="Are you sure you want to delete this event?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
      />
    </div>
  );
}
