import { PrismaClient } from '@prisma/client';

// Prisma builds parameterised queries, so user input never gets concatenated into SQL.
export const prisma = new PrismaClient();
