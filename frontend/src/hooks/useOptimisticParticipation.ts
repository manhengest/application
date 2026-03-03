import { useCallback, useState } from 'react';
import { api } from '../lib/api';
import { extractErrorMessage, type AppError } from '../lib/utils';
import type { Event } from '../types';

function applyParticipation(event: Event, isJoined: boolean): Event {
  if ((event.isJoined ?? false) === isJoined) {
    return event;
  }
  const participantCount = Math.max(
    0,
    event.participantCount + (isJoined ? 1 : -1),
  );
  const isFull =
    event.capacity !== null ? participantCount >= event.capacity : false;

  return {
    ...event,
    isJoined,
    participantCount,
    isFull,
  };
}

export interface UseOptimisticParticipationSingleOptions {
  event: Event | null;
  setEvent: React.Dispatch<React.SetStateAction<Event | null>>;
  eventId: string | undefined;
  setError: (msg: string) => void;
  onNavigateToLogin: () => void;
  user: { id: string } | null;
}

export function useOptimisticParticipationSingle({
  event,
  setEvent,
  eventId,
  setError,
  onNavigateToLogin,
  user,
}: UseOptimisticParticipationSingleOptions) {
  const [pending, setPending] = useState(false);

  const handleJoin = useCallback(async () => {
    if (!user) {
      onNavigateToLogin();
      return;
    }
    if (!event || !eventId || pending || event.isFull || event.isJoined) return;

    setError('');
    const previousEvent = event;
    setPending(true);
    setEvent(applyParticipation(event, true));

    try {
      await api.post<Event>(`/events/${eventId}/join`);
    } catch (err) {
      setEvent(previousEvent);
      setError(extractErrorMessage(err as AppError, 'Failed to join event'));
    } finally {
      setPending(false);
    }
  }, [event, eventId, pending, user, setEvent, setError, onNavigateToLogin]);

  const handleLeave = useCallback(async () => {
    if (!event || !eventId || pending || !event.isJoined) return;

    setError('');
    const previousEvent = event;
    setPending(true);
    setEvent(applyParticipation(event, false));

    try {
      await api.post<Event>(`/events/${eventId}/leave`);
    } catch (err) {
      setEvent(previousEvent);
      setError(extractErrorMessage(err as AppError, 'Failed to leave event'));
    } finally {
      setPending(false);
    }
  }, [event, eventId, pending, setEvent, setError]);

  return { handleJoin, handleLeave, pending };
}

export interface UseOptimisticParticipationListOptions {
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  setError: (msg: string) => void;
  onNavigateToLogin: () => void;
  user: { id: string } | null;
}

export function useOptimisticParticipationList({
  events,
  setEvents,
  setError,
  onNavigateToLogin,
  user,
}: UseOptimisticParticipationListOptions) {
  const [pendingEventIds, setPendingEventIds] = useState<string[]>([]);

  const handleJoin = useCallback(
    async (e: React.MouseEvent, eventId: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (!user) {
        onNavigateToLogin();
        return;
      }
      if (pendingEventIds.includes(eventId)) return;

      const previousEvent = events.find((ev) => ev.id === eventId);
      if (!previousEvent || previousEvent.isFull || previousEvent.isJoined)
        return;

      setError('');
      setPendingEventIds((prev) => [...prev, eventId]);
      setEvents((prev) =>
        prev.map((ev) => (ev.id === eventId ? applyParticipation(ev, true) : ev)),
      );

      try {
        await api.post<Event>(`/events/${eventId}/join`);
      } catch (err) {
        setEvents((prev) =>
          prev.map((ev) => (ev.id === eventId ? previousEvent : ev)),
        );
        setError(extractErrorMessage(err as AppError, 'Failed to join event'));
      } finally {
        setPendingEventIds((prev) => prev.filter((id) => id !== eventId));
      }
    },
    [events, pendingEventIds, user, setEvents, setError, onNavigateToLogin],
  );

  const handleLeave = useCallback(
    async (e: React.MouseEvent, eventId: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (pendingEventIds.includes(eventId)) return;

      const previousEvent = events.find((ev) => ev.id === eventId);
      if (!previousEvent || !previousEvent.isJoined) return;

      setError('');
      setPendingEventIds((prev) => [...prev, eventId]);
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === eventId ? applyParticipation(ev, false) : ev,
        ),
      );

      try {
        await api.post<Event>(`/events/${eventId}/leave`);
      } catch (err) {
        setEvents((prev) =>
          prev.map((ev) => (ev.id === eventId ? previousEvent : ev)),
        );
        setError(extractErrorMessage(err as AppError, 'Failed to leave event'));
      } finally {
        setPendingEventIds((prev) => prev.filter((id) => id !== eventId));
      }
    },
    [events, pendingEventIds, setEvents, setError],
  );

  const isPending = useCallback(
    (eventId: string) => pendingEventIds.includes(eventId),
    [pendingEventIds],
  );

  return { handleJoin, handleLeave, isPending };
}
