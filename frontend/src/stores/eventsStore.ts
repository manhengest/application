import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api } from '../lib/api';
import { extractErrorMessage, isCancelError, type AppError } from '../lib/utils';
import type { Event } from '../types';

let fetchAbortController: AbortController | null = null;

interface EventsState {
  events: Event[];
  loading: boolean;
  error: string;
  selectedTags: string[];
  setEvents: (
    eventsOrUpdater: Event[] | ((prev: Event[]) => Event[]),
  ) => void;
  setSelectedTags: (tags: string[]) => void;
  setError: (msg: string) => void;
  clearError: () => void;
  fetchEvents: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  events: [] as Event[],
  loading: false,
  error: '',
  selectedTags: [] as string[],
};

export const useEventsStore = create<EventsState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setEvents: (eventsOrUpdater) =>
        set((s) => ({
          events:
            typeof eventsOrUpdater === 'function'
              ? eventsOrUpdater(s.events)
              : eventsOrUpdater,
        })),

      setSelectedTags: (tags) => set({ selectedTags: tags }),

      setError: (msg) => set({ error: msg }),

      clearError: () => set({ error: '' }),

      fetchEvents: async () => {
        if (fetchAbortController) {
          fetchAbortController.abort();
        }
        fetchAbortController = new AbortController();
        const signal = fetchAbortController.signal;

        set({ loading: true, error: '' });

        const { selectedTags } = get();
        const params =
          selectedTags.length > 0 ? { params: { tags: selectedTags } } : {};

        try {
          const { data } = await api.get<Event[]>('/events', {
            signal,
            ...params,
          });
          if (!signal.aborted) {
            set({ events: data, loading: false });
          }
        } catch (err) {
          if (!signal.aborted && !isCancelError(err as AppError)) {
            set({
              error: extractErrorMessage(
                err as AppError,
                'Failed to load events',
              ),
              loading: false,
            });
          }
        }
      },

      reset: () => set(initialState),
    }),
    { name: 'EventsStore', enabled: import.meta.env.DEV },
  ),
);
