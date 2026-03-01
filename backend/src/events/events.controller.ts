import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { EventsService, EventResponse } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalAuth } from '../auth/decorators/optional-auth.decorator';
import { User } from '../database/entities/user.entity';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private events: EventsService) {}

  @OptionalAuth()
  @Get()
  @ApiOperation({ summary: 'List events (public only when unauthenticated)' })
  @ApiResponse({ status: 200, description: 'List of events' })
  list(@CurrentUser() user: User | null): Promise<EventResponse[]> {
    return this.events.findAll(user);
  }

  @OptionalAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get event details' })
  @ApiResponse({ status: 200, description: 'Event details' })
  @ApiResponse({ status: 403, description: 'Private event - access denied' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  get(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User | null,
  ): Promise<EventResponse> {
    return this.events.findOne(id, user);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create event (auth required)' })
  @ApiBody({ type: CreateEventDto })
  @ApiResponse({ status: 201, description: 'Event created' })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid date' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() dto: CreateEventDto, @CurrentUser() user: User): Promise<EventResponse> {
    return this.events.create(dto, user);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit event (organizer only)' })
  @ApiBody({ type: UpdateEventDto })
  @ApiResponse({ status: 200, description: 'Event updated' })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid capacity/date' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only organizer can edit' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: User,
  ): Promise<EventResponse> {
    return this.events.update(id, dto, user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete event (organizer only)' })
  @ApiResponse({ status: 200, description: 'Event deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only organizer can delete' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<{ success: true }> {
    return this.events.remove(id, user);
  }

  @Post(':id/join')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join event' })
  @ApiResponse({ status: 201, description: 'Joined event' })
  @ApiResponse({ status: 400, description: 'Already joined or event full' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Private event - access denied' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  join(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User): Promise<EventResponse> {
    return this.events.join(id, user);
  }

  @Post(':id/leave')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave event' })
  @ApiResponse({ status: 200, description: 'Left event' })
  @ApiResponse({ status: 400, description: 'Not a participant' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  leave(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User): Promise<EventResponse> {
    return this.events.leave(id, user);
  }
}
