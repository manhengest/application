import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { Event } from '../database/entities/event.entity';
import { Participant } from '../database/entities/participant.entity';
import { User } from '../database/entities/user.entity';

describe('EventsService', () => {
  let service: EventsService;
  let eventRepo: jest.Mocked<Repository<Event>>;
  let participantRepo: jest.Mocked<Repository<Participant>>;

  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hash',
    createdAt: new Date(),
    organizedEvents: [],
    participations: [],
  };

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
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockEventRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
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
        transaction: jest.fn((fn) => fn({
          getRepository: jest.fn((Entity: unknown) =>
            Entity === Event
              ? { findOne: jest.fn().mockResolvedValue(mockEvent), create: jest.fn(), save: jest.fn() }
              : { findOne: jest.fn().mockResolvedValue(null), create: jest.fn().mockReturnValue({}), save: jest.fn() }
          ),
        })),
      },
    };

    const mockParticipantRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getRepositoryToken(Event), useValue: mockEventRepo },
        { provide: getRepositoryToken(Participant), useValue: mockParticipantRepo },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    eventRepo = module.get(getRepositoryToken(Event));
    participantRepo = module.get(getRepositoryToken(Participant));
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

      expect(qb.andWhere).toHaveBeenCalledWith('e.visibility = :vis', {
        vis: 'public',
      });
    });

    it('should return all events when user is authenticated', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockEvent]),
      };
      (eventRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.findAll(mockUser);

      expect(qb.andWhere).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'event-1', title: 'Test Event' });
    });
  });

  describe('findOne', () => {
    it('should throw 404 when event not found', async () => {
      (eventRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('nonexistent', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for private event when no user', async () => {
      const privateEvent = { ...mockEvent, visibility: 'private' as const };
      (eventRepo.findOne as jest.Mock).mockResolvedValue(privateEvent);

      await expect(service.findOne('event-1', null)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException for private event when user is neither organizer nor participant', async () => {
      const otherUser = { ...mockUser, id: 'user-2' };
      const privateEvent = {
        ...mockEvent,
        visibility: 'private' as const,
        participants: [],
      };
      (eventRepo.findOne as jest.Mock).mockResolvedValue(privateEvent);

      await expect(service.findOne('event-1', otherUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return private event when user is organizer', async () => {
      const privateEvent = {
        ...mockEvent,
        visibility: 'private' as const,
        participants: [],
      };
      (eventRepo.findOne as jest.Mock).mockResolvedValue(privateEvent);

      const result = await service.findOne('event-1', mockUser);

      expect(result).toMatchObject({ id: 'event-1', isOrganizer: true });
    });

    it('should return private event when user is participant', async () => {
      const participantUser = { ...mockUser, id: 'user-2' };
      const privateEvent = {
        ...mockEvent,
        visibility: 'private' as const,
        participants: [{ userId: 'user-2', eventId: 'event-1', user: participantUser }],
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
  });

  describe('update', () => {
    it('should reject when non-organizer tries to edit', async () => {
      const otherUser = { ...mockUser, id: 'user-2' };
      (eventRepo.findOne as jest.Mock).mockResolvedValue(mockEvent);

      await expect(
        service.update('event-1', { title: 'New' }, otherUser),
      ).rejects.toThrow(ForbiddenException);
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

      await expect(
        service.update('event-1', { capacity: 1 }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject past date in dto', async () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      (eventRepo.findOne as jest.Mock).mockResolvedValue(mockEvent);

      await expect(
        service.update('event-1', { date: today.toISOString() }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should reject when non-organizer tries to delete', async () => {
      const otherUser = { ...mockUser, id: 'user-2' };
      (eventRepo.findOne as jest.Mock).mockResolvedValue(mockEvent);

      await expect(service.remove('event-1', otherUser)).rejects.toThrow(
        ForbiddenException,
      );
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

      await expect(service.join('event-1', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for private event when user is not organizer', async () => {
      const otherUser = { ...mockUser, id: 'user-2' };
      const privateEvent = { ...mockEvent, visibility: 'private' as const };
      txEventRepo.findOne.mockResolvedValue(privateEvent);

      await expect(service.join('event-1', otherUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException when already joined', async () => {
      txEventRepo.findOne.mockResolvedValue(mockEvent);
      txParticipantRepo.findOne.mockResolvedValue({
        userId: mockUser.id,
        eventId: 'event-1',
      });

      await expect(service.join('event-1', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when event is full', async () => {
      txEventRepo.findOne.mockResolvedValue({ ...mockEvent, capacity: 2 });
      txParticipantRepo.findOne.mockResolvedValue(null);
      txParticipantRepo.count.mockResolvedValue(2);

      await expect(service.join('event-1', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should save participant and return event on success', async () => {
      txEventRepo.findOne.mockResolvedValue(mockEvent);
      txParticipantRepo.findOne.mockResolvedValue(null);
      txParticipantRepo.count.mockResolvedValue(0);
      (eventRepo.findOne as jest.Mock).mockResolvedValue({
        ...mockEvent,
        participantCount: 1,
        participants: [{ userId: mockUser.id, user: mockUser }],
      });

      const result = await service.join('event-1', mockUser);

      expect(txParticipantRepo.create).toHaveBeenCalledWith({
        userId: mockUser.id,
        eventId: 'event-1',
      });
      expect(txParticipantRepo.save).toHaveBeenCalled();
      expect(result).toMatchObject({ id: 'event-1' });
    });
  });

  describe('leave', () => {
    it('should throw BadRequestException when not a participant', async () => {
      (participantRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.leave('event-1', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should remove participant and return event on success', async () => {
      const participant = {
        userId: mockUser.id,
        eventId: 'event-1',
      };
      (participantRepo.findOne as jest.Mock).mockResolvedValue(participant);
      (participantRepo.remove as jest.Mock).mockResolvedValue(undefined);
      (eventRepo.findOne as jest.Mock).mockResolvedValue({
        ...mockEvent,
        participants: [],
      });

      const result = await service.leave('event-1', mockUser);

      expect(participantRepo.remove).toHaveBeenCalledWith(participant);
      expect(result).toMatchObject({ id: 'event-1' });
    });
  });
});
