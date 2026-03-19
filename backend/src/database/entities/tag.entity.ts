import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  Index,
} from 'typeorm';
import { Event } from './event.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  name: string;

  @Index('IDX_TAGS_NORMALIZED_NAME', { unique: true })
  @Column({ name: 'normalized_name', length: 50 })
  normalizedName: string;

  @ManyToMany(() => Event, (event) => event.tags)
  events: Event[];
}
