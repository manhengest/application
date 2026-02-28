import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Event } from './entities/event.entity';
import { Participant } from './entities/participant.entity';

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/event_management',
    entities: [User, Event, Participant],
    synchronize: true,
  });
  await ds.initialize();

  const userRepo = ds.getRepository(User);
  const eventRepo = ds.getRepository(Event);

  const existing = await userRepo.count();
  if (existing > 0) {
    console.log('Database already seeded, skipping.');
    await ds.destroy();
    return;
  }

  const hash1 = await bcrypt.hash('password123', 10);
  const hash2 = await bcrypt.hash('password456', 10);

  const user1 = userRepo.create({
    name: 'Eduard',
    email: 'eduard@example.com',
    passwordHash: hash1,
  });
  const user2 = userRepo.create({
    name: 'Jane Doe',
    email: 'jane@example.com',
    passwordHash: hash2,
  });
  await userRepo.save([user1, user2]);

  const now = new Date();
  const event1 = eventRepo.create({
    title: 'Tech Conference 2025',
    description: 'Annual technology conference featuring the latest innovations in AI and machine learning.',
    date: new Date(now.getFullYear(), 10, 15, 9, 0),
    location: 'Convention Center, San Francisco',
    capacity: 500,
    visibility: 'public',
    organizerId: user1.id,
  });
  const event2 = eventRepo.create({
    title: 'Community Networking Meetup',
    description: 'Connect with local professionals and expand your network.',
    date: new Date(now.getFullYear(), 9, 20, 18, 30),
    location: 'Downtown Coffee Shop',
    capacity: 30,
    visibility: 'public',
    organizerId: user1.id,
  });
  const event3 = eventRepo.create({
    title: 'Design Workshop',
    description: 'Hands-on workshop covering modern UI/UX design principles.',
    date: new Date(now.getFullYear(), 9, 25, 14, 0),
    location: 'Creative Space Studio',
    capacity: 20,
    visibility: 'public',
    organizerId: user2.id,
  });
  await eventRepo.save([event1, event2, event3]);

  console.log('Seeded 2 users and 3 events.');
  await ds.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
