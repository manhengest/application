import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import {
  toLocalDatetimeInput,
  getTomorrowDateMin,
  extractErrorMessage,
  isCancelError,
  type AppError,
} from '../lib/utils';
import type { Event } from '../types';
import { TagSelector } from '../components/TagSelector';

export function EventForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [tags, setTags] = useState<string[]>([]);
  const [tagOptions, setTagOptions] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState('');
  const [tagError, setTagError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);

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
    if (!isEdit || !id) return;
    const ac = new AbortController();
    setFetchLoading(true);
    void api
      .get<Event>(`/events/${id}`, { signal: ac.signal })
      .then((r) => {
        const e = r.data;
        const local = toLocalDatetimeInput(e.date);
        setTitle(e.title);
        setDescription(e.description);
        setEventDate(local.slice(0, 10));
        setEventTime(local.slice(11, 16));
        setLocation(e.location);
        setCapacity(e.capacity != null ? String(e.capacity) : '');
        setVisibility(e.visibility);
        setTags(e.tags?.map((t) => t.name) ?? []);
      })
      .catch((err: AppError) => {
        if (!isCancelError(err)) {
          setError(extractErrorMessage(err, 'Failed to load event'));
        }
      })
      .finally(() => {
        if (!ac.signal.aborted) setFetchLoading(false);
      });
    return () => ac.abort();
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const localDateTime = `${eventDate}T${eventTime}`;
    const payload = {
      title,
      description,
      date: new Date(localDateTime).toISOString(),
      location,
      capacity: capacity ? parseInt(capacity, 10) : undefined,
      visibility,
      tags,
    };
    try {
      if (isEdit) {
        const { data } = await api.patch<Event>(`/events/${id}`, payload);
        void navigate(`/events/${data.id}`);
      } else {
        const { data } = await api.post<Event>('/events', payload);
        void navigate(`/events/${data.id}`);
      }
    } catch (err) {
      setError(extractErrorMessage(err as AppError, 'Failed to save event'));
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading && isEdit) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-xl mx-auto">
      <Link
        to={isEdit ? `/events/${id}` : '/events'}
        className="text-indigo-600 hover:underline mb-4 inline-flex items-center gap-1"
      >
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
          {(error || tagError) && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error || tagError}
            </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="dd.mm.yyyy"
                min={getTomorrowDateMin()}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                placeholder="--:--"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <TagSelector
              selected={tags}
              options={tagOptions}
              onChange={setTags}
              maxTags={5}
              placeholder="e.g., Tech, Art, Business"
              disabled={loading}
            />
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
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => void navigate(-1)}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
