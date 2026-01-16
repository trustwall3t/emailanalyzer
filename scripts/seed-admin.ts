// Load environment variables FIRST, before any other imports
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

// Ensure DATABASE_URL is set before importing Prisma
if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not set in environment variables');
}

// Now import Prisma and other modules
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
	const email = process.env.ADMIN_EMAIL || 'admin@emailextractor.com';
	const password = process.env.ADMIN_PASSWORD || 'admin123';

	// Hash password
	const hashedPassword = await bcrypt.hash(password, 10);

	// Create or update admin user
	const admin = await prisma.user.upsert({
		where: { email },
		update: {
			password: hashedPassword,
			role: 'ADMIN',
		},
		create: {
			email,
			password: hashedPassword,
			role: 'ADMIN',
		},
	});

	console.log('✅ Admin user created/updated:', {
		id: admin.id,
		email: admin.email,
		role: admin.role,
	});
	console.log('\n📝 Default credentials:');
	console.log(`   Email: ${email}`);
	console.log(`   Password: ${password}`);
	console.log('\n⚠️  Please change the default password after first login!');
}

main()
	.catch((e) => {
		console.error('❌ Error seeding admin:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
