export interface User {
  id: string;
  name: string;
  email: string;
}

export interface EventParticipant {
  id: string;
  name: string;
  initials: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number | null;
  visibility: 'public' | 'private';
  organizerId: string;
  organizer: { id: string; name: string; email?: string } | null;
  participantCount: number;
  participants: EventParticipant[];
  isJoined?: boolean;
  isFull?: boolean;
  isOrganizer?: boolean;
  isExpired?: boolean;
}
