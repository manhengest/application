import { Test, type TestingModule } from '@nestjs/testing';
import { SnapshotBuilderService } from './snapshot-builder.service';
import { EventsService } from '../events/events.service';
import { UsersService } from '../users/users.service';
import { TagsService } from '../tags/tags.service';
import type { User } from '../database/entities/user.entity';

describe('SnapshotBuilderService', () => {
  let service: SnapshotBuilderService;
  let eventsService: jest.Mocked<EventsService>;

  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hash',
    createdAt: new Date(),
    organizedEvents: [],
    participations: [],
  };

  const mockMyEvents = [
    {
      id: 'e1',
      title: 'Tech Conference 2025',
      date: new Date(Date.now() + 86400000 * 7),
      location: 'SF',
      tags: [{id: 't1', name: 'Tech'}],
      isOrganizer: true,
    },
    {
      id: 'e2',
      title: 'Design Workshop',
      date: new Date(Date.now() - 86400000 * 3),
      location: 'Studio',
      tags: [{id: 't2', name: 'Art'}],
      isOrganizer: false,
    },
  ];

  beforeEach(async () => {
    const mockUsersService = {
      getMyEvents: jest.fn().mockResolvedValue(mockMyEvents),
    };
    const mockEventsService = {
      findOne: jest.fn().mockResolvedValue({
        id: 'e1',
        title: 'Tech Conference 2025',
        date: new Date(Date.now() + 86400000 * 7),
        location: 'SF',
        tags: [{id: 't1', name: 'Tech'}],
        participants: [{name: 'Alice'}, {name: 'Bob'}],
        participantCount: 2,
      }),
    };
    const mockTagsService = {
      findAll: jest.fn().mockResolvedValue([
        {id: 't1', name: 'Tech'},
        {id: 't2', name: 'Art'},
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnapshotBuilderService,
        {provide: EventsService, useValue: mockEventsService},
        {provide: UsersService, useValue: mockUsersService},
        {provide: TagsService, useValue: mockTagsService},
      ],
    }).compile();

    service = module.get(SnapshotBuilderService);
    eventsService = module.get(EventsService);
    tagsService = module.get(TagsService);
  });

  it('should detect intent for count questions', async () => {
    const { snapshot, fallback } = await service.buildSnapshot(
      mockUser,
      'How many events do I have?',
    );
    expect(fallback).toBeNull();
    expect(snapshot.intent).toBe('count');
    expect(snapshot.allMyEvents).toHaveLength(2);
  });

  it('should detect intent for participants questions', async () => {
    const { snapshot, fallback } = await service.buildSnapshot(
      mockUser,
      "Who's attending the Tech Conference 2025?",
    );
    expect(fallback).toBeNull();
    expect(snapshot.intent).toBe('participants');
    expect(eventsService.findOne).toHaveBeenCalledWith('e1', mockUser);
  });

  it('should return fallback for empty or unclear questions', async () => {
    const { fallback } = await service.buildSnapshot(mockUser, '');
    expect(fallback).toBe(
      "Sorry, I didn't understand that. Please try rephrasing your question.",
    );
  });

  it('should return fallback for unsupported questions', async () => {
    const { fallback } = await service.buildSnapshot(
      mockUser,
      'What is the meaning of life?',
    );
    expect(fallback).toBe(
      "Sorry, I didn't understand that. Please try rephrasing your question.",
    );
  });

  it('should include availableTags in snapshot', async () => {
    const { snapshot } = await service.buildSnapshot(
      mockUser,
      'How many events do I have?',
    );
    expect(snapshot.availableTags).toContain('Tech');
    expect(snapshot.availableTags).toContain('Art');
  });
});
