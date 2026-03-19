import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsUUID, MinLength } from 'class-validator';

export class AskAssistantDto {
  @ApiProperty({
    example: 'What events am I attending this week?',
    description: 'Natural-language question about events',
  })
  @IsString()
  @MinLength(1)
  question: string;

  @ApiPropertyOptional({
    enum: ['events', 'my-events', 'event-details'],
    description: 'Page context for better snapshot building',
  })
  @IsOptional()
  @IsIn(['events', 'my-events', 'event-details'])
  page?: 'events' | 'my-events' | 'event-details';

  @ApiPropertyOptional({
    description: 'Event ID when page is event-details',
  })
  @IsOptional()
  @IsUUID()
  eventId?: string;
}

export type AssistantIntent =
  | 'count'
  | 'upcoming'
  | 'date-range'
  | 'past-range'
  | 'tag-filter'
  | 'participants'
  | 'fallback';

export type AssistantScope = 'personal' | 'event-details' | 'public';

export interface AskAssistantResponse {
  answer: string;
  usedScope: AssistantScope;
  intent: AssistantIntent;
  referencedEventIds: string[];
  disclaimer?: string;
}
