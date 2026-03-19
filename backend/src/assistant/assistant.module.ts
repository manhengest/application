import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { SnapshotBuilderService } from './snapshot-builder.service';
import { EventsModule } from '../events/events.module';
import { UsersModule } from '../users/users.module';
import { TagsModule } from '../tags/tags.module';

@Module({
  imports: [EventsModule, UsersModule, TagsModule],
  controllers: [AssistantController],
  providers: [AssistantService, SnapshotBuilderService],
})
export class AssistantModule {}
