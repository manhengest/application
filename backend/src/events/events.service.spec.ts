import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { Event } from '../database/entities/event.entity';
import { Participant } from '../database/entities/participant.entity';
import { Tag } from '../database/entities/tag.entity';
import { type User } from '../database/entities/user.entity';

describe('EventsService', () => {
  let service: EventsService;
  let eventRepo: jest.Mocked<Repository<Event>>;
  let tagRepo: jest.Mocked<Repository<Tag>>;

  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hash',
    createdAt: new Date(),
    organizedEvents: [],
    participations: [],
  };

  const mockTag = { id: 'tag-1', name: 'Tech', normalizedName: 'tech', events: [] };
  const mockEvent: Event = {
    id: 'event-1',
    title: 'Test Event',
    description: 'Desc',
    date: new Date(Date.now() + 86400000 * 2),
    location: 'Location',
    capacity: 5,
    visibility: 'public',
    organizerId: 'user-1',
    organizer: mockUser,
    participants: [],
    tags: [],
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockEventRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
      manager: {
        transaction: jest.fn((fn) =>
          fn({
            getRepository: jest.fn((Entity: unknown) =>
              Entity === Event
                ? {
                    findOne: jest.fn().mockResolvedValue(mockEvent),
                    create: jest.fn(),
                    save: jest.fn(),
                  }
                : {
                    findOne: jest.fn().mockResolvedValue(null),
                    create: jest.fn().mockReturnValue({}),
                    save: jest.fn(),
                  },
            ),
          }),
        ),
      },
    };

    const mockParticipantRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const mockTagRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto) => ({ ...mockTag, ...dto })),
      save: jest.fn().mockImplementation((t) => Promise.resolve(t)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getRepositoryToken(Event), useValue: mockEventRepo },
        { provide: getRepositoryToken(Participant), useValue: mockParticipantRepo },
        { provide: getRepositoryToken(Tag), useValue: mockTagRepo },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    eventRepo = module.get(getRepositoryToken(Event));
    tagRepo = module.get(getRepositoryToken(Tag));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should filter to public events when user is null', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      (eventRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.findAll(null);

      expect(qb.andWhere).toHaveBeenCalledWith('e.visibility = :publicVisibility', {
        publicVisibility: 'public',
      });
    });

    it('should return public events and organizer/participant events when user is authenticated', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockEvent]),
      };
      (eventRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      (eventRepo.find as jest.Mock).mockResolvedValue([{ ...mockEvent, tags: [] }]);

      const result = await service.findAll(mockUser);

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('e.visibility = :publicVisibility'),
        { publicVisibility: 'public', userId: mockUser.id },
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'event-1', title: 'Test Event', tags: [] });
    });

    it('should filter by tags when tagNames provided', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      (eventRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      (eventRepo.find as jest.Mock).mockResolvedValue([]);

      await service.findAll(null, ['Tech', 'Music']);

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('EXISTS'),
        expect.objectContaining({ tagNames: ['tech', 'music'] }),
      );
    });
  });

  describe('findOne', () => {
    it('should throw 404 when event not found', async () => {
      (eventRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('nonexistent', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for private event when no user', async () => {
      const privateEvent = { ...mockEvent, visibility: 'private' as const };
      (eventRepo.findOne as jest.Mock).mockResolvedValue(privateEvent);

      await expect(service.findOne('event-1', null)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for private event when user is neither organizer nor participant', async () => {
      const otherUser = { ...mockUser, id: 'user-2' };
      const privateEvent = {
        ...mockEvent,
        visibility: 'private' as const,
        participants: [],
      };
      (eventRepo.findOne as jest.Mock).mockResolvedValue(privateEvent);

      await expect(service.findOne('event-1', otherUser)).rejects.toThrow(ForbiddenException);
    });

    it('should return private event when user is organizer', async () => {
      const privateEvent = {
        ...mockEvent,
        visibility: 'private' as const,
        participants: [],
        tags: [],
      };
      (eventRepo.findOne as jest.Mock).mockResolvedValue(privateEvent);

      const result = await service.findOne('event-1', mockUser);

      expect(result).toMatchObject({ id: 'event-1', isOrganizer: true, tags: [] });
    });

    it('should return event with tags when present', async () => {
      const eventWithTags = {
        ...mockEvent,
        tags: [mockTag],
      };
      (eventRepo.findOne as jest.Mock).mockResolvedValue(eventWithTags);

      const result = await service.findOne('event-1', mockUser);

      expect(result.tags).toEqual([{ id: 'tag-1', name: 'Tech' }]);
    });

    it('should return private event when user is participant', async () => {
      const participantUser = { ...mockUser, id: 'user-2' };
      const privateEvent = {
        ...mockEvent,
        visibility: 'private' as const,
        participants: [{ userId: 'user-2', eventId: 'event-1', user: participantUser }],
        tags: [],
      };
      (eventRepo.findOne as jest.Mock).mockResolvedValue(privateEvent);

      const result = await service.findOne('event-1', participantUser);

      expect(result).toMatchObject({ id: 'event-1', isJoined: true });
    });
  });

  describe('create', () => {
    it('should reject date before tomorrow', async () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      (eventRepo.create as jest.Mock).mockReturnValue({ ...mockEvent, id: 'new-id' });
      (eventRepo.save as jest.Mock).mockResolvedValue({});
      (eventRepo.findOne as jest.Mock).mockResolvedValue(mockEvent);

      await expect(
        service.create(
          {
            title: 'Test',
            description: 'Desc',
            date: today.toISOString(),
            location: 'Loc',
            visibility: 'public',
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create event with valid future date', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      tomorrow.setHours(14, 0, 0, 0);
      const newEvent = {
        ...mockEvent,
        id: 'new-id',
        title: 'New Event',
        date: tomorrow,
        organizer: mockUser,
        participants: [],
        tags: [],
      };
      (eventRepo.create as jest.Mock).mockReturnValue(newEvent);
      (eventRepo.save as jest.Mock).mockResolvedValue(newEvent);
      (eventRepo.findOne as jest.Mock).mockResolvedValue(newEvent);

      const result = await service.create(
        {
          title: 'New Event',
          description: 'Desc',
          date: tomorrow.toISOString(),
          location: 'Loc',
          visibility: 'public',
        },
        mockUser,
      );

      expect(eventRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Event',
          organizerId: 'user-1',
        }),
      );
      expect(eventRepo.save).toHaveBeenCalled();
      expect(result).toMatchObject({ id: 'new-id', title: 'New Event' });
    });

    it('should create event with tags and upsert new tag', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      tomorrow.setHours(14, 0, 0, 0);
      const newTag = { ...mockTag, id: 'new-tag-id', name: 'Art', normalizedName: 'art' };
      (tagRepo.findOne as jest.Mock).mockResolvedValue(null);
      (tagRepo.create as jest.Mock).mockReturnValue(newTag);
      (tagRepo.save as jest.Mock).mockResolvedValue(newTag);
      const newEvent = {
        ...mockEvent,
        id: 'new-id',
        title: 'Art Event',
        date: tomorrow,
        organizer: mockUser,
        participants: [],
        tags: [newTag],
      };
      (eventRepo.create as jest.Mock).mockReturnValue(newEvent);
      (eventRepo.save as jest.Mock).mockResolvedValue(newEvent);
      (eventRepo.findOne as jest.Mock).mockResolvedValue(newEvent);

      const result = await service.create(
        {
          title: 'Art Event',
          description: 'Desc',
          date: tomorrow.toISOString(),
          location: 'Loc',
          visibility: 'public',
          tags: ['Art'],
        },
        mockUser,
      );

      expect(tagRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Art', normalizedName: 'art' }),
      );
      expect(result).toMatchObject({ id: 'new-id', title: 'Art Event' });
      expect(result.tags).toEqual([{ id: 'new-tag-id', name: 'Art' }]);
    });

    it('should reject more than 5 tags', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      tomorrow.setHours(14, 0, 0, 0);

      await expect(
        service.create(
          {
            title: 'Event',
            description: 'Desc',
            date: tomorrow.toISOString(),
            location: 'Loc',
            visibility: 'public',
            tags: ['A', 'B', 'C', 'D', 'E', 'F'],
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should reject when non-organizer tries to edit', async () => {
      const otherUser = { ...mockUser, id: 'user-2' };
      (eventRepo.findOne as jest.Mock).mockResolvedValue(mockEvent);

      await expect(service.update('event-1', { title: 'New' }, otherUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject capacity less than current participants', async () => {
      const eventWithParticipants = {
        ...mockEvent,
        participants: [
          { userId: 'u1', eventId: 'event-1' },
          { userId: 'u2', eventId: 'event-1' },
        ],
      };
      (eventRepo.findOne as jest.Mock).mockResolvedValue(eventWithParticipants);
      (eventRepo.save as jest.Mock).mockResolvedValue({});
      (eventRepo.createQueryBuilder as jest.Mock).mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([eventWithParticipants]),
      });

      await expect(service.update('event-1', { capacity: 1 }, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject past date in dto', async () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      (eventRepo.findOne as jest.Mock).mockResolvedValue(mockEvent);

      await expect(
        service.update('event-1', { date: today.toISOString() }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update tags when organizer provides tags', async () => {
      const eventWithTags = { ...mockEvent, participants: [], tags: [] };
      (eventRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(eventWithTags)
        .mockResolvedValueOnce({ ...eventWithTags, tags: [mockTag] });
      (tagRepo.findOne as jest.Mock).mockResolvedValue(mockTag);
      (eventRepo.save as jest.Mock).mockResolvedValue({});

      const result = await service.update('event-1', { tags: ['Tech'] }, mockUser);

      expect(result.tags).toEqual([{ id: 'tag-1', name: 'Tech' }]);
    });
  });

  describe('remove', () => {
    it('should reject when non-organizer tries to delete', async () => {
      const otherUser = { ...mockUser, id: 'user-2' };
      (eventRepo.findOne as jest.Mock).mockResolvedValue(mockEvent);

      await expect(service.remove('event-1', otherUser)).rejects.toThrow(ForbiddenException);
    });

    it('should delete event when organizer', async () => {
      (eventRepo.findOne as jest.Mock).mockResolvedValue(mockEvent);
      (eventRepo.remove as jest.Mock).mockResolvedValue(undefined);

      const result = await service.remove('event-1', mockUser);

      expect(eventRepo.remove).toHaveBeenCalledWith(mockEvent);
      expect(result).toEqual({ success: true });
    });
  });

  describe('join', () => {
    let txEventRepo: { findOne: jest.Mock };
    let txParticipantRepo: {
      findOne: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      save: jest.Mock;
    };

    beforeEach(() => {
      txEventRepo = { findOne: jest.fn() };
      txParticipantRepo = {
        findOne: jest.fn(),
        count: jest.fn(),
        create: jest.fn().mockReturnValue({}),
        save: jest.fn(),
      };
      (eventRepo.manager.transaction as jest.Mock).mockImplementation(
        async (fn: (tx: { getRepository: (e: unknown) => unknown }) => unknown) => {
          const tx = {
            getRepository: (Entity: unknown) =>
              Entity === Event ? txEventRepo : txParticipantRepo,
          };
          return fn(tx);
        },
      );
    });

    it('should throw NotFoundException when event not found', async () => {
      txEventRepo.findOne.mockResolvedValue(null);

      await expect(service.join('event-1', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for private event when user is not organizer', async () => {
      const otherUser = { ...mockUser, id: 'user-2' };
      const privateEvent = { ...mockEvent, visibility: 'private' as const };
      txEventRepo.findOne.mockResolvedValue(privateEvent);

      await expect(service.join('event-1', otherUser)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when already joined', async () => {
      txEventRepo.findOne.mockResolvedValue(mockEvent);
      txParticipantRepo.findOne.mockResolvedValue({
        userId: mockUser.id,
        eventId: 'event-1',
      });

      await expect(service.join('event-1', mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when event is full', async () => {
      txEventRepo.findOne.mockResolvedValue({ ...mockEvent, capacity: 2 });
      txParticipantRepo.findOne.mockResolvedValue(null);
      txParticipantRepo.count.mockResolvedValue(2);

      await expect(service.join('event-1', mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should save participant and return event on success', async () => {
      const otherUser = { ...mockUser, id: 'user-2' };
      const eventByOther = { ...mockEvent, organizerId: 'user-1' };
      txEventRepo.findOne.mockResolvedValue(eventByOther);
      txParticipantRepo.findOne.mockResolvedValue(null);
      txParticipantRepo.count.mockResolvedValue(0);
      (eventRepo.findOne as jest.Mock).mockResolvedValue({
        ...eventByOther,
        participantCount: 1,
        participants: [{ userId: otherUser.id, user: otherUser }],
      });

      const result = await service.join('event-1', otherUser);

      expect(txParticipantRepo.create).toHaveBeenCalledWith({
        userId: otherUser.id,
        eventId: 'event-1',
      });
      expect(txParticipantRepo.save).toHaveBeenCalled();
      expect(result).toMatchObject({ id: 'event-1' });
    });
  });

  describe('leave', () => {
    let txEventRepo: { findOne: jest.Mock };
    let txParticipantRepo: { findOne: jest.Mock; remove: jest.Mock };

    beforeEach(() => {
      txEventRepo = { findOne: jest.fn().mockResolvedValue(mockEvent) };
      txParticipantRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        remove: jest.fn().mockResolvedValue(undefined),
      };
      (eventRepo.manager.transaction as jest.Mock).mockImplementation(
        async (fn: (tx: { getRepository: (e: unknown) => unknown }) => unknown) => {
          const tx = {
            getRepository: (Entity: unknown) =>
              Entity === Event ? txEventRepo : txParticipantRepo,
          };
          return fn(tx);
        },
      );
    });

    it('should throw BadRequestException when not a participant', async () => {
      txParticipantRepo.findOne.mockResolvedValue(null);

      await expect(service.leave('event-1', mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should remove participant and return event on success', async () => {
      const participant = {
        userId: mockUser.id,
        eventId: 'event-1',
      };
      txParticipantRepo.findOne.mockResolvedValue(participant);
      (eventRepo.findOne as jest.Mock).mockResolvedValue({
        ...mockEvent,
        participants: [],
      });

      const result = await service.leave('event-1', mockUser);

      expect(txParticipantRepo.remove).toHaveBeenCalledWith(participant);
      expect(result).toMatchObject({ id: 'event-1' });
    });
  });
});
