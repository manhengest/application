import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';
import { UsersService } from './users.service';
import { Event } from '../database/entities/event.entity';
import { type User } from '../database/entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let eventRepo: jest.Mocked<Repository<Event>>;

  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hash',
    createdAt: new Date(),
    organizedEvents: [],
    participations: [],
  };

  const organizerUser = { id: 'user-1', name: 'Organizer' };
  const mockTag = { id: 'tag-1', name: 'Tech', normalizedName: 'tech' };
  const eventA = {
    id: 'event-a',
    title: 'Event A',
    date: new Date('2025-04-01'),
    organizerId: 'user-1',
    organizer: organizerUser,
    description: '',
    location: '',
    capacity: null,
    visibility: 'public' as const,
    participants: [],
    tags: [mockTag],
    createdAt: new Date(),
  };
  const eventB = {
    id: 'event-b',
    title: 'Event B',
    date: new Date('2025-04-15'),
    organizerId: 'user-2',
    organizer: { id: 'user-2', name: 'Other' },
    description: '',
    location: '',
    capacity: null,
    visibility: 'public' as const,
    participants: [],
    tags: [],
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockEventRepo = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        innerJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: getRepositoryToken(Event), useValue: mockEventRepo }],
    }).compile();

    service = module.get<UsersService>(UsersService);
    eventRepo = module.get(getRepositoryToken(Event));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMyEvents', () => {
    it('should deduplicate events that appear as both organizer and participant', async () => {
      (eventRepo.find as jest.Mock).mockResolvedValue([eventA]);
      (eventRepo.createQueryBuilder as jest.Mock).mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([eventA]),
      });

      const result = await service.getMyEvents(mockUser);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'event-a', title: 'Event A' });
    });

    it('should sort events by date ascending', async () => {
      const lateEvent = { ...eventB, id: 'event-late', date: new Date('2025-05-01') };
      (eventRepo.find as jest.Mock).mockResolvedValue([lateEvent, eventA]);
      (eventRepo.createQueryBuilder as jest.Mock).mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getMyEvents(mockUser);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('event-a');
      expect(result[1].id).toBe('event-late');
      expect(new Date(result[0].date).getTime()).toBeLessThan(new Date(result[1].date).getTime());
    });

    it('should set isOrganizer true when user is organizer, false otherwise', async () => {
      (eventRepo.find as jest.Mock).mockResolvedValue([eventA]);
      (eventRepo.createQueryBuilder as jest.Mock).mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([eventB]),
      });

      const result = await service.getMyEvents(mockUser);

      const organizedEvent = result.find((e) => e.id === 'event-a');
      const participatedEvent = result.find((e) => e.id === 'event-b');
      expect(organizedEvent?.isOrganizer).toBe(true);
      expect(participatedEvent?.isOrganizer).toBe(false);
    });

    it('should include tags in returned event summaries', async () => {
      (eventRepo.find as jest.Mock).mockResolvedValue([eventA]);
      (eventRepo.createQueryBuilder as jest.Mock).mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getMyEvents(mockUser);

      expect(result).toHaveLength(1);
      expect(result[0].tags).toEqual([{ id: 'tag-1', name: 'Tech' }]);
    });
  });
});
