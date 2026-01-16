'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

export async function deleteSession(sessionId: string) {
	try {
		const session = await requireAuth();

		// Verify the session exists and belongs to the current user
		const analysisSession = await prisma.analysisSession.findUnique({
			where: { id: sessionId },
			select: { userId: true },
		});

		if (!analysisSession) {
			throw new Error('Session not found');
		}

		if (analysisSession.userId !== session.user.id) {
			throw new Error('Unauthorized: Session does not belong to current user');
		}

		// Delete the session (cascades to participants and contactSignals)
		await prisma.analysisSession.delete({
			where: { id: sessionId },
		});

		return { success: true };
	} catch (error: any) {
		// Log and re-throw actual errors
		console.error('Error deleting session:', error);
		throw error;
	}
}

