/**
 * Truncates tags and event_tags tables to fix schema sync issues.
 * Use when db:fix doesn't resolve "column contains null values" errors.
 * Run: npm run db:reset
 */
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Event } from './entities/event.entity';
import { Participant } from './entities/participant.entity';
import { Tag } from './entities/tag.entity';

async function resetTags() {
  const ds = new DataSource({
    type: 'postgres',
    url:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/event_management',
    entities: [User, Event, Participant, Tag],
    synchronize: false,
  });
  await ds.initialize();

  await ds.query('TRUNCATE event_tags, tags RESTART IDENTITY CASCADE');
  await ds.destroy();
  console.log(
    'Truncated tags tables. Run: npm run start:dev (then npm run seed if needed)',
  );
}

resetTags().catch((e) => {
  console.error(e);
  process.exit(1);
});
