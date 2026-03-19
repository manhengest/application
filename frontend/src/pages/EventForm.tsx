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
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { FormField } from '../components/ui/FormField';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Card } from '../components/ui/Card';

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
      <Card>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isEdit ? 'Edit Event' : 'Create New Event'}
        </h1>
        <p className="text-gray-600 mb-6">
          {isEdit ? 'Update the event details.' : 'Fill in the details to create an amazing event'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(error || tagError) && <ErrorAlert message={error || tagError} />}
          <FormField label="Event Title" required>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Tech Conference 2025"
              required
            />
          </FormField>
          <FormField label="Description" required>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what makes your event special..."
              required
              rows={4}
            />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Date" required>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="dd.mm.yyyy"
                min={getTomorrowDateMin()}
                required
              />
            </FormField>
            <FormField label="Time" required>
              <Input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                placeholder="--:--"
                required
              />
            </FormField>
          </div>
          <FormField label="Location" required>
            <Input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Convention Center, San Francisco"
              required
            />
          </FormField>
          <FormField
            label="Capacity (optional)"
            hint="Maximum number of participants. Leave empty for unlimited capacity."
          >
            <Input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Leave empty for unlimited"
            />
          </FormField>
          <div>
            <FormField label="Tags">
              <TagSelector
                selected={tags}
                options={tagOptions}
                onChange={setTags}
                maxTags={5}
                placeholder="e.g., Tech, Art, Business"
                disabled={loading}
              />
            </FormField>
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
            <Button variant="secondary" onClick={() => void navigate(-1)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Create Event'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
