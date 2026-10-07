import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const password = process.env.SEED_PASSWORD || 'Demo@12345';
const day = (n) => new Date(Date.now() + n * 86400000);

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email: 'admin@taskorbit.test' },
    update: {},
    create: { fullName: 'Admin Demo', email: 'admin@taskorbit.test', passwordHash, role: 'ADMIN' },
  });
  const user = await prisma.user.upsert({
    where: { email: 'demo@taskorbit.test' },
    update: {},
    create: { fullName: 'Demo User', email: 'demo@taskorbit.test', passwordHash },
  });
  if ((await prisma.project.count({ where: { ownerId: user.id } })) > 0) return console.log('Seed data already present');

  const launch = await prisma.project.create({
    data: {
      ownerId: user.id, name: 'Website Relaunch', description: 'Redesign and ship the marketing site.',
      status: 'IN_PROGRESS', startDate: day(-20), endDate: day(10),
      tasks: { create: [
        { name: 'Collect brand assets', priority: 'LOW', status: 'COMPLETED', dueDate: day(-15), completedAt: day(-16) },
        { name: 'Design homepage', priority: 'HIGH', status: 'IN_PROGRESS', dueDate: day(1) },
        { name: 'Write launch copy', priority: 'MEDIUM', status: 'PENDING', dueDate: day(-2) },
        { name: 'QA on mobile browsers', priority: 'MEDIUM', status: 'PENDING', dueDate: day(6) },
      ] },
    },
  });
  await prisma.project.create({
    data: {
      ownerId: user.id, name: 'Mobile App Beta', description: 'Android beta for early testers.',
      status: 'NOT_STARTED', startDate: day(3), endDate: day(45),
      tasks: { create: [
        { name: 'Set up Expo project', priority: 'HIGH', status: 'PENDING', dueDate: day(4) },
        { name: 'Prepare store listing', priority: 'LOW', status: 'PENDING', dueDate: day(30) },
      ] },
    },
  });
  await prisma.project.create({ data: { ownerId: user.id, name: 'Q3 Planning', status: 'COMPLETED', startDate: day(-60), endDate: day(-30) } });
  console.log(`Seeded users admin@taskorbit.test / demo@taskorbit.test (password: ${password}) and project ${launch.name}`);
}

main().finally(() => prisma.$disconnect());
