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
  });

  describe('remove', () => {
    it('should reject when non-organizer tries to delete', async () => {
      const otherUser = { ...mockUser, id: 'user-2' };
      (eventRepo.findOne as jest.Mock).mockResolvedValue(mockEvent);

      await expect(service.remove('event-1', otherUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findOne', () => {
    it('should throw 404 when event not found', async () => {
      (eventRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('nonexistent', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
