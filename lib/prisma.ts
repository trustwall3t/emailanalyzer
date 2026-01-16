import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables if not already loaded
if (!process.env.DATABASE_URL) {
	config({ path: resolve(process.cwd(), '.env.local') });
	config({ path: resolve(process.cwd(), '.env') });
}

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error('DATABASE_URL is not set. Please check your .env file.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		adapter,
		log: ['error'],
	});

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
}
