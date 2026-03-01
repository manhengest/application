import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Event } from './event.entity';

@Entity('participants')
export class Participant {
  @Index('IDX_PARTICIPANTS_USER_ID')
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @Index('IDX_PARTICIPANTS_EVENT_ID')
  @PrimaryColumn({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => User, (user) => user.participations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Event, (event) => event.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
