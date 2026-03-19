import { Injectable } from '@nestjs/common';
import { User } from '../database/entities/user.entity';
import { EventsService } from '../events/events.service';
import { UsersService } from '../users/users.service';
import { TagsService } from '../tags/tags.service';
import { normalizeTagName } from '../database/utils/normalize-tag';
import type { AssistantIntent } from './dto/ask-assistant.dto';

export interface MyEventSummary {
  id: string;
  title: string;
  date: string;
  location: string;
  tags: string[];
  isOrganizer: boolean;
}

export interface EventSnapshot {
  id: string;
  title: string;
  date: string;
  location: string;
  tags: string[];
  participantCount: number;
  participants?: string[];
}

export interface AssistantSnapshot {
  allMyEvents: MyEventSummary[];
  myUpcomingEvents: MyEventSummary[];
  myPastEvents: MyEventSummary[];
  myOrganizedEvents: MyEventSummary[];
  matchedEventDetails: EventSnapshot[];
  availableTags: string[];
  intent: AssistantIntent;
}

const FALLBACK_MESSAGE =
  "Sorry, I didn't understand that. Please try rephrasing your question.";

@Injectable()
export class SnapshotBuilderService {
  constructor(
    private eventsService: EventsService,
    private usersService: UsersService,
    private tagsService: TagsService,
  ) {}

  async buildSnapshot(
    user: User,
    question: string,
    eventId?: string,
  ): Promise<{ snapshot: AssistantSnapshot; fallback: string | null }> {
    const intent = this.detectIntent(question);
    if (intent === 'fallback') {
      return {
        snapshot: this.emptySnapshot(),
        fallback: FALLBACK_MESSAGE,
      };
    }

    const [myEventsRaw, allTags] = await Promise.all([
      this.usersService.getMyEvents(user),
      this.tagsService.findAll(),
    ]);

    const now = new Date();
    const availableTags = allTags.map((t) => t.name);

    const myEvents: MyEventSummary[] = myEventsRaw.map((e) => ({
      id: e.id,
      title: e.title,
      date: new Date(e.date).toISOString(),
      location: e.location,
      tags: (e.tags ?? []).map((t) => t.name),
      isOrganizer: e.isOrganizer ?? false,
    }));

    const upcoming = myEvents.filter((e) => new Date(e.date) >= now);
    const past = myEvents.filter((e) => new Date(e.date) < now);
    const organized = myEvents.filter((e) => e.isOrganizer);

    let filtered: MyEventSummary[] = myEvents;
    const tagNames = this.extractTagNames(question, availableTags);

    if (tagNames.length > 0) {
      const normalizedTags = new Set(tagNames.map((n) => normalizeTagName(n)));
      filtered = myEvents.filter((e) =>
        e.tags.some((t) => normalizedTags.has(normalizeTagName(t))),
      );
    }

    const dateRange = this.parseDateRange(question, now);
    if (dateRange) {
      const { start, end } = dateRange;
      filtered = filtered.filter((e) => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      });
    }

    const matchedEventDetails: EventSnapshot[] = [];
    if (intent === 'participants' || eventId) {
      const eventTitle = this.extractEventTitle(question);
      const candidates = eventId
        ? [myEvents.find((e) => e.id === eventId)].filter(Boolean)
        : myEvents.filter(
            (e) =>
              eventTitle &&
              normalizeTagName(e.title).includes(normalizeTagName(eventTitle)),
          );
      if (candidates.length > 0) {
        const ids = candidates.map((c) => c!.id);
        for (const id of ids) {
          const full = await this.eventsService.findOne(id, user);
          matchedEventDetails.push({
            id: full.id,
            title: full.title,
            date: new Date(full.date).toISOString(),
            location: full.location,
            tags: full.tags.map((t) => t.name),
            participantCount: full.participantCount,
            participants: full.participants.map((p) => p.name),
          });
        }
      }
    }

    const snapshot: AssistantSnapshot = {
      allMyEvents: myEvents,
      myUpcomingEvents: dateRange
        ? filtered.filter((e) => new Date(e.date) >= now)
        : intent === 'tag-filter'
          ? filtered.filter((e) => new Date(e.date) >= now)
          : upcoming,
      myPastEvents: intent === 'past-range'
        ? filtered.filter((e) => new Date(e.date) < now)
        : intent === 'tag-filter'
          ? filtered.filter((e) => new Date(e.date) < now)
          : dateRange
            ? filtered.filter((e) => new Date(e.date) < now)
            : past,
      myOrganizedEvents: organized,
      matchedEventDetails,
      availableTags,
      intent,
    };

    return { snapshot, fallback: null };
  }

  getFallbackMessage(): string {
    return FALLBACK_MESSAGE;
  }

  private emptySnapshot(): AssistantSnapshot {
    return {
      allMyEvents: [],
      myUpcomingEvents: [],
      myPastEvents: [],
      myOrganizedEvents: [],
      matchedEventDetails: [],
      availableTags: [],
      intent: 'fallback',
    };
  }

  private detectIntent(question: string): AssistantIntent {
    const q = question.trim().toLowerCase();
    if (!q) return 'fallback';

    if (
      /\b(how many|count|total|number of)\b.*\b(event|events)\b/i.test(q) ||
      /\b(event|events)\b.*\b(how many|count|total)\b/i.test(q)
    ) {
      return 'count';
    }

    if (/\b(who|who's|who is)\b.*\b(attend|attending|participant)\b/i.test(q) ||
        /\b(attend|attending|participant)\b.*\b(who|who's)\b/i.test(q) ||
        /\b(attendees?|participants?)\b/i.test(q)) {
      return 'participants';
    }

    if (
      /\b(previous|past|last)\s*(week|month)\b/i.test(q) ||
      /\b(last week|past week)\b/i.test(q)
    ) {
      return 'past-range';
    }

    if (
      /\b(upcoming|next|this week|this weekend|future)\b/i.test(q) ||
      /\b(what am i (attend|going)|what do i have)\b/i.test(q)
    ) {
      return 'upcoming';
    }

    if (
      /\b(tech|design|marketing|music|art|business|networking)\b/i.test(q) ||
      /\b(my\s+)?\w+\s+events/i.test(q) ||
      /\b(show|list|filter).*\b(by\s+)?tag\b/i.test(q)
    ) {
      return 'tag-filter';
    }

    if (
      /\b(on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(q) ||
      /\b(march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i.test(q) ||
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/i.test(q) ||
      /\b(from|between)\s+.*\s+(to|and)\s+/i.test(q)
    ) {
      return 'date-range';
    }

    return 'fallback';
  }

  private extractTagNames(question: string, availableTags: string[]): string[] {
    const found: string[] = [];
    const q = question.toLowerCase();
    for (const tag of availableTags) {
      if (q.includes(tag.toLowerCase())) found.push(tag);
    }
    return found;
  }

  private extractEventTitle(question: string): string | null {
    const m = question.match(/(?:who'?s? attending|participants? of)\s+(?:the\s+)?([^?]+)/i);
    if (m) return m[1].trim().replace(/^\s*the\s+/i, '');
    const m2 = question.match(/([^?]+)\s+(?:attendees?|participants?)/i);
    if (m2) return m2[1].trim().replace(/^\s*the\s+/i, '');
    return null;
  }

  private parseDateRange(
    question: string,
    ref: Date,
  ): { start: Date; end: Date } | null {
    const q = question.toLowerCase();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIdx = dayNames.findIndex((d) => q.includes(d));
    if (dayIdx >= 0) {
      const d = new Date(ref);
      const curr = d.getDay();
      let diff = dayIdx - curr;
      if (diff <= 0) diff += 7;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      return { start: d, end };
    }

    if (/\b(previous|past|last)\s*week\b/i.test(q)) {
      const end = new Date(ref);
      end.setDate(end.getDate() - 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    if (/\bthis\s+week\b/i.test(q)) {
      const start = new Date(ref);
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    if (/\bthis\s+weekend\b/i.test(q)) {
      const start = new Date(ref);
      const day = start.getDay();
      const sat = day === 0 ? -1 : 6 - day;
      start.setDate(start.getDate() + sat);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    return null;
  }
}
