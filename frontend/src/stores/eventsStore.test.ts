import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Event } from '../types';

const mockEvents: Event[] = [
  {
    id: 'ev-1',
    title: 'Test Event',
    description: 'Description',
    date: new Date().toISOString(),
    location: 'Location',
    capacity: 10,
    visibility: 'public',
    organizerId: 'org-1',
    organizer: { id: 'org-1', name: 'Organizer' },
    participantCount: 0,
    participants: [],
    tags: [],
  },
];

const mockApiGet = vi.fn();

vi.mock('../lib/api', () => ({
  api: {
    get: (...args: unknown[]) =>
      mockApiGet(...args) as Promise<{ data: Event[] }>,
  },
}));

const { useEventsStore } = await import('./eventsStore');

describe('eventsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEventsStore.setState({
      events: [],
      loading: false,
      error: '',
      selectedTags: [],
    });
  });

  it('has initial state', () => {
    const state = useEventsStore.getState();
    expect(state.events).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBe('');
    expect(state.selectedTags).toEqual([]);
  });

  it('setEvents updates events with direct value', () => {
    useEventsStore.getState().setEvents(mockEvents);

    expect(useEventsStore.getState().events).toEqual(mockEvents);
  });

  it('setEvents updates events with functional updater', () => {
    useEventsStore.getState().setEvents(mockEvents);
    useEventsStore.getState().setEvents((prev) => [...prev, { ...mockEvents[0], id: 'ev-2' }]);

    expect(useEventsStore.getState().events).toHaveLength(2);
    expect(useEventsStore.getState().events[1].id).toBe('ev-2');
  });

  it('setSelectedTags updates selectedTags', () => {
    useEventsStore.getState().setSelectedTags(['tech', 'art']);

    expect(useEventsStore.getState().selectedTags).toEqual(['tech', 'art']);
  });

  it('setError updates error', () => {
    useEventsStore.getState().setError('Something went wrong');

    expect(useEventsStore.getState().error).toBe('Something went wrong');
  });

  it('clearError resets error', () => {
    useEventsStore.getState().setError('Error');
    useEventsStore.getState().clearError();

    expect(useEventsStore.getState().error).toBe('');
  });

  it('reset restores initial state', () => {
    useEventsStore.getState().setEvents(mockEvents);
    useEventsStore.getState().setSelectedTags(['tech']);
    useEventsStore.getState().setError('Error');

    useEventsStore.getState().reset();

    expect(useEventsStore.getState().events).toEqual([]);
    expect(useEventsStore.getState().selectedTags).toEqual([]);
    expect(useEventsStore.getState().error).toBe('');
  });

  describe('fetchEvents', () => {
    it('fetches events and updates state on success', async () => {
      mockApiGet.mockResolvedValue({ data: mockEvents });

      await useEventsStore.getState().fetchEvents();

      expect(mockApiGet).toHaveBeenCalledWith('/events', expect.any(Object));
      expect(useEventsStore.getState().events).toEqual(mockEvents);
      expect(useEventsStore.getState().loading).toBe(false);
      expect(useEventsStore.getState().error).toBe('');
    });

    it('fetches with tags when selectedTags is set', async () => {
      mockApiGet.mockResolvedValue({ data: [] });
      useEventsStore.getState().setSelectedTags(['tech', 'art']);

      await useEventsStore.getState().fetchEvents();

      expect(mockApiGet).toHaveBeenCalledWith(
        '/events',
        expect.objectContaining({
          params: { tags: ['tech', 'art'] },
        }),
      );
    });

    it('sets error on fetch failure', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'));

      await useEventsStore.getState().fetchEvents();

      expect(useEventsStore.getState().error).toBe('Network error');
      expect(useEventsStore.getState().loading).toBe(false);
    });

    it('sets loading true during fetch', async () => {
      let resolvePromise: (value: { data: Event[] }) => void;
      const promise = new Promise<{ data: Event[] }>((r) => {
        resolvePromise = r;
      });
      mockApiGet.mockReturnValue(promise);

      const fetchPromise = useEventsStore.getState().fetchEvents();

      expect(useEventsStore.getState().loading).toBe(true);

      resolvePromise!({ data: mockEvents });
      await fetchPromise;

      expect(useEventsStore.getState().loading).toBe(false);
    });
  });
});
