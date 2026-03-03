import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Event } from '../database/entities/event.entity';
import { Participant } from '../database/entities/participant.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

export interface EventResponse {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  capacity: number | null;
  visibility: 'public' | 'private';
  organizerId: string;
  organizer: { id: string; name: string; email: string } | null;
  participantCount: number;
  participants: { id: string; name: string }[];
  isJoined: boolean;
  isFull: boolean;
  isOrganizer: boolean;
  isExpired: boolean;
}

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventRepo: Repository<Event>,
    @InjectRepository(Participant)
    private participantRepo: Repository<Participant>,
  ) {}

  async findAll(user: User | null): Promise<EventResponse[]> {
    const qb = this.eventRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.organizer', 'organizer')
      .leftJoinAndSelect('e.participants', 'p')
      .leftJoinAndSelect('p.user', 'pu');

    if (!user) {
      qb.andWhere('e.visibility = :publicVisibility', {
        publicVisibility: 'public',
      });
    } else {
      qb.andWhere(
        `(e.visibility = :publicVisibility
          OR e.organizer_id = :userId
          OR EXISTS (
            SELECT 1 FROM participants p2
            WHERE p2.event_id = e.id AND p2.user_id = :userId
          ))`,
        { publicVisibility: 'public', userId: user.id },
      );
    }

    qb.orderBy('e.date', 'ASC');
    const events = await qb.getMany();
    return events.map((e) => this.toEventResponse(e, user?.id));
  }

  async findOne(id: string, user: User | null): Promise<EventResponse> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: ['organizer', 'participants', 'participants.user'],
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (event.visibility === 'private') {
      if (!user) {
        throw new ForbiddenException('Private event - authentication required');
      }
      const isOrganizer = event.organizerId === user.id;
      const isParticipant = event.participants?.some(
        (p) => p.userId === user.id,
      );
      if (!isOrganizer && !isParticipant) {
        throw new ForbiddenException('Private event - access denied');
      }
    }
    return this.toEventResponse(event, user?.id);
  }

  async create(dto: CreateEventDto, organizer: User): Promise<EventResponse> {
    const date = new Date(dto.date);
    if (date < this.tomorrowStart()) {
      throw new BadRequestException('Event date must be tomorrow or later');
    }
    const event = this.eventRepo.create({
      ...dto,
      date,
      organizerId: organizer.id,
    });
    await this.eventRepo.save(event);
    return this.findOne(event.id, organizer);
  }

  async update(
    id: string,
    dto: UpdateEventDto,
    user: User,
  ): Promise<EventResponse> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: ['participants'],
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (event.organizerId !== user.id) {
      throw new ForbiddenException('Only organizer can edit');
    }
    if (dto.capacity != null) {
      const count = event.participants?.length ?? 0;
      if (dto.capacity < count) {
        throw new BadRequestException(
          `Capacity cannot be less than current participants (${count})`,
        );
      }
    }
    if (dto.date) {
      const date = new Date(dto.date);
      if (date < this.tomorrowStart()) {
        throw new BadRequestException('Event date must be tomorrow or later');
      }
      event.date = date;
    }
    if (dto.title != null) event.title = dto.title;
    if (dto.description != null) event.description = dto.description;
    if (dto.location != null) event.location = dto.location;
    if (dto.capacity != null) event.capacity = dto.capacity;
    if (dto.visibility != null) event.visibility = dto.visibility;
    await this.eventRepo.save(event);
    return this.findOne(event.id, user);
  }

  async remove(id: string, user: User): Promise<{ success: true }> {
    const event = await this.eventRepo.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (event.organizerId !== user.id) {
      throw new ForbiddenException('Only organizer can delete');
    }
    await this.eventRepo.remove(event);
    return { success: true };
  }

  async join(eventId: string, user: User): Promise<EventResponse> {
    return this.eventRepo.manager.transaction(async (tx) => {
      // Fetch event without relations when using FOR UPDATE - PostgreSQL disallows
      // FOR UPDATE with LEFT JOIN (nullable side of outer join)
      const event = await tx.getRepository(Event).findOne({
        where: { id: eventId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!event) {
        throw new NotFoundException('Event not found');
      }
      if (event.visibility === 'private') {
        if (event.organizerId !== user.id) {
          throw new ForbiddenException(
            'Private event - only the organizer can join (invite-only)',
          );
        }
      }
      const participantRepo = tx.getRepository(Participant);
      const existing = await participantRepo.findOne({
        where: { userId: user.id, eventId },
      });
      if (existing) {
        throw new BadRequestException('Already joined');
      }
      if (event.capacity != null) {
        const count = await participantRepo.count({ where: { eventId } });
        if (count >= event.capacity) {
          throw new BadRequestException('Event is full');
        }
      }
      const p = participantRepo.create({ userId: user.id, eventId });
      await participantRepo.save(p);
      return this.findOne(eventId, user);
    });
  }

  async leave(eventId: string, user: User): Promise<EventResponse> {
    return this.eventRepo.manager.transaction(async (tx) => {
      await tx.getRepository(Event).findOne({
        where: { id: eventId },
        lock: { mode: 'pessimistic_write' },
      });
      const p = await tx.getRepository(Participant).findOne({
        where: { userId: user.id, eventId },
      });
      if (!p) {
        throw new BadRequestException('Not a participant');
      }
      await tx.getRepository(Participant).remove(p);
      return this.findOne(eventId, user);
    });
  }

  private tomorrowStart(): Date {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    t.setHours(0, 0, 0, 0);
    return t;
  }

  private toEventResponse(event: Event, userId?: string): EventResponse {
    const participants = event.participants ?? [];
    const participantCount = participants.length;
    const isJoined = userId
      ? participants.some((p) => p.userId === userId)
      : false;
    const isFull = event.capacity != null && participantCount >= event.capacity;
    const isOrganizer = event.organizerId === userId;
    const isExpired = new Date(event.date) < new Date();

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      capacity: event.capacity,
      visibility: event.visibility,
      organizerId: event.organizerId,
      organizer: {
        id: event.organizer.id,
        name: event.organizer.name,
        email: event.organizer.email,
      },
      participantCount,
      participants: participants.map((p) => ({
        id: p.user.id,
        name: p.user.name,
      })),
      isJoined,
      isFull,
      isOrganizer,
      isExpired,
    };
  }
}
