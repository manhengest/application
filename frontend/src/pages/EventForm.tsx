import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { toLocalDatetimeInput, extractErrorMessage } from '../lib/utils';
import type { Event } from '../types';

const tomorrow = () => {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  t.setHours(0, 0, 0, 0);
  return t.toISOString().slice(0, 16);
};

export function EventForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit || !id) {
      setDate(tomorrow());
      return;
    }
    const ac = new AbortController();
    setFetchLoading(true);
    api
      .get<Event>(`/events/${id}`, { signal: ac.signal })
      .then((r) => {
        const e = r.data;
        setTitle(e.title);
        setDescription(e.description);
        setDate(toLocalDatetimeInput(e.date));
        setLocation(e.location);
        setCapacity(e.capacity != null ? String(e.capacity) : '');
        setVisibility(e.visibility);
      })
      .catch((err) => {
        if (err.name !== 'CanceledError') {
          setError(extractErrorMessage(err, 'Failed to load event'));
        }
      })
      .finally(() => setFetchLoading(false));
    return () => ac.abort();
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const payload = {
      title,
      description,
      date: new Date(date).toISOString(),
      location,
      capacity: capacity ? parseInt(capacity, 10) : undefined,
      visibility,
    };
    try {
      if (isEdit) {
        const { data } = await api.patch<Event>(`/events/${id}`, payload);
        navigate(`/events/${data.id}`);
      } else {
        const { data } = await api.post<Event>('/events', payload);
        navigate(`/events/${data.id}`);
      }
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Failed to save event'));
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading && isEdit) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-xl mx-auto">
      <Link to={isEdit ? `/events/${id}` : '/events'} className="text-indigo-600 hover:underline mb-4 inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isEdit ? 'Edit Event' : 'Create New Event'}
        </h1>
        <p className="text-gray-600 mb-6">
          {isEdit ? 'Update the event details.' : 'Fill in the details to create an amazing event'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Tech Conference 2025"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what makes your event special..."
              required
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={tomorrow()}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Convention Center, San Francisco"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacity (optional)
            </label>
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Leave empty for unlimited"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum number of participants. Leave empty for unlimited capacity.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === 'public'}
                  onChange={() => setVisibility('public')}
                  className="text-indigo-600"
                />
                <span>Public - Anyone can see and join this event</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === 'private'}
                  onChange={() => setVisibility('private')}
                  className="text-indigo-600"
                />
                <span>Private - Only invited people can see this event</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
