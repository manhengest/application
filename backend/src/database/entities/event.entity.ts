import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Participant } from './participant.entity';

export type EventVisibility = 'public' | 'private';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column()
  location: string;

  @Column({ type: 'int', nullable: true })
  capacity: number | null;

  @Column({ type: 'varchar', length: 20 })
  visibility: EventVisibility;

  @Index('IDX_EVENTS_ORGANIZER_ID')
  @Column({ name: 'organizer_id' })
  organizerId: string;

  @ManyToOne(() => User, (user) => user.organizedEvents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;

  @OneToMany(() => Participant, (participant) => participant.event)
  participants: Participant[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
