import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function requireAuth() {
	const session = await auth();

	if (!session || !session.user) {
		redirect('/login');
	}

	// Ensure session has the expected structure
	if (!session.user.id) {
		redirect('/login');
	}

	return session;
}

