import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Event } from '../database/entities/event.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Event)
    private eventRepo: Repository<Event>,
  ) {}

  async getMyEvents(user: User) {
    const asOrganizer = await this.eventRepo.find({
      where: { organizerId: user.id },
      relations: ['organizer'],
      order: { date: 'ASC' },
    });
    const asParticipant = await this.eventRepo
      .createQueryBuilder('e')
      .innerJoin('e.participants', 'p', 'p.userId = :userId', { userId: user.id })
      .leftJoinAndSelect('e.organizer', 'organizer')
      .orderBy('e.date', 'ASC')
      .getMany();

    const seen = new Set<string>();
    const combined: Event[] = [];
    for (const e of [...asOrganizer, ...asParticipant]) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        combined.push(e);
      }
    }
    combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return combined.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      date: e.date,
      location: e.location,
      capacity: e.capacity,
      visibility: e.visibility,
      organizerId: e.organizerId,
      organizer: e.organizer
        ? {
            id: e.organizer.id,
            name: e.organizer.name,
          }
        : null,
      isOrganizer: e.organizerId === user.id,
    }));
  }
}
