/**
 * One-time fix for tags table: removes rows with NULL name that block
 * TypeORM synchronize from adding NOT NULL constraint.
 * Run: npm run db:fix
 */
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Event } from './entities/event.entity';
import { Participant } from './entities/participant.entity';
import { Tag } from './entities/tag.entity';

async function fixTags() {
  const ds = new DataSource({
    type: 'postgres',
    url:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/event_management',
    entities: [User, Event, Participant, Tag],
    synchronize: false,
  });
  await ds.initialize();

  const rows = (await ds.query(
    'SELECT COUNT(*)::int as cnt FROM tags WHERE name IS NULL',
  )) as unknown;
  const nullCount = Array.isArray(rows) ? (rows[0] as { cnt: number })?.cnt : 0;
  if (nullCount === 0) {
    await ds.destroy();
    console.log(
      'No tags with NULL name found. If the app still fails, try: npm run db:reset',
    );
    return;
  }

  await ds.query(
    'DELETE FROM event_tags WHERE tag_id IN (SELECT id FROM tags WHERE name IS NULL)',
  );
  await ds.query('DELETE FROM tags WHERE name IS NULL');
  await ds.destroy();
  console.log(
    `Removed ${nullCount} tag(s) with NULL name. You can now run: npm run start:dev`,
  );
}

fixTags().catch((e) => {
  console.error(e);
  process.exit(1);
});

