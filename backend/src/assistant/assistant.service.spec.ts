import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { SnapshotBuilderService } from './snapshot-builder.service';
import type { User } from '../database/entities/user.entity';

describe('AssistantService', () => {
  let service: AssistantService;
  let snapshotBuilder: jest.Mocked<SnapshotBuilderService>;

  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hash',
    createdAt: new Date(),
    organizedEvents: [],
    participations: [],
  };

  beforeEach(async () => {
    const mockSnapshotBuilder = {
      buildSnapshot: jest.fn().mockResolvedValue({
        snapshot: {
          intent: 'count',
          allMyEvents: [],
          myUpcomingEvents: [],
          myPastEvents: [],
          myOrganizedEvents: [],
          matchedEventDetails: [],
          availableTags: [],
        },
        fallback: null,
      }),
      getFallbackMessage: jest.fn().mockReturnValue(
        "Sorry, I didn't understand that. Please try rephrasing your question.",
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssistantService,
        { provide: SnapshotBuilderService, useValue: mockSnapshotBuilder },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(AssistantService);
    snapshotBuilder = module.get(SnapshotBuilderService);
  });

  it('should throw UnauthorizedException when user is null', async () => {
    await expect(
      service.ask({ question: 'How many events?' }, null),
    ).rejects.toThrow(UnauthorizedException);
    expect(snapshotBuilder.buildSnapshot).not.toHaveBeenCalled();
  });

  it('should return fallback for unclear questions', async () => {
    (snapshotBuilder.buildSnapshot as jest.Mock).mockResolvedValue({
      snapshot: { intent: 'fallback' as const },
      fallback: "Sorry, I didn't understand that. Please try rephrasing your question.",
    });

    const result = await service.ask(
      { question: 'xyz' },
      mockUser,
    );

    expect(result.answer).toBe(
      "Sorry, I didn't understand that. Please try rephrasing your question.",
    );
    expect(result.intent).toBe('fallback');
  });

  it('should call snapshot builder with question and eventId', async () => {
    (snapshotBuilder.buildSnapshot as jest.Mock).mockResolvedValue({
      snapshot: { intent: 'participants' as const, matchedEventDetails: [] },
      fallback: null,
    });

    await service.ask(
      { question: "Who's attending?", eventId: 'ev-1', page: 'event-details' },
      mockUser,
    );

    expect(snapshotBuilder.buildSnapshot).toHaveBeenCalledWith(
      mockUser,
      "Who's attending?",
      'ev-1',
    );
  });
});
