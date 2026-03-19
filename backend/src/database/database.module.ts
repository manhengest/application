import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Event } from './entities/event.entity';
import { Participant } from './entities/participant.entity';
import { Tag } from './entities/tag.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get(
          'DATABASE_URL',
          'postgresql://postgres:postgres@localhost:5432/event_management',
        ),
        entities: [User, Event, Participant, Tag],
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Event, Participant, Tag]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
