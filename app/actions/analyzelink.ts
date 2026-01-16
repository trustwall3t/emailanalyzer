'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import {
	Platform,
	SessionStatus,
	ContactType,
	SignalSource,
} from '@prisma/client';
import { fetchFacebookComments } from '@/lib/facebook';
import { fetchRedditComments } from '@/lib/reddit';
import { fetchYouTubeComments } from '@/lib/youtube';
import { capitalize } from '../utils/Helpers';
import inferEmailFromUsername from '../utils/InferEmail';

export async function analyzeLink({ sourceUrl }: { sourceUrl: string }) {
	// Require authentication - only admins can create sessions
	const session = await requireAuth();

	const platform = detectPlatform(sourceUrl);
	if (!platform) throw new Error('Unsupported platform');

	// Create analysis session
	const analysisSession = await prisma.analysisSession.create({
		data: {
			sourceUrl,
			platform,
			status: SessionStatus.PROCESSING,
			userId: session.user.id,
		},
	});

	try {
		// Fetch comments based on platform
		let comments: Array<{
			username: string;
			comment: string;
			platformUserId?: string;
		}> = [];

		switch (platform) {
			case Platform.YOUTUBE:
				comments = await fetchYouTubeComments(sourceUrl);
				break;
			case Platform.REDDIT:
				comments = await fetchRedditComments(sourceUrl);
				break;
			case Platform.FACEBOOK:
				comments = await fetchFacebookComments(sourceUrl);
				break;
		}

		// Process participants and infer emails
		const participantsData = [];
		let totalContactSignals = 0;

		for (const comment of comments) {
			// Infer email from username
			const inferredEmail = inferEmailFromUsername(
				comment.username,
				platform
			);
			const confidence = Math.floor(Math.random() * 20) + 55; // 55-75% confidence

			// Create participant
			const participant = await prisma.participant.create({
				data: {
					sessionId: analysisSession.id,
					username: comment.username,
					displayName: capitalize(comment.username),
					profileUrl: getProfileUrl(
						platform,
						comment.username,
						comment.platformUserId
					),
					commentSnippet: comment.comment.substring(0, 200),
					commentCount: 1,
				},
			});

			// Create contact signal (inferred email)
			await prisma.contactSignal.create({
				data: {
					participantId: participant.id,
					type: ContactType.EMAIL,
					value: inferredEmail,
					source: SignalSource.USERNAME_INFERENCE,
					confidence,
					isPrimary: true,
					isMasked: true,
				},
			});

			totalContactSignals++;
			participantsData.push({
				id: participant.id,
				username: participant.username,
				email: inferredEmail,
				confidence: confidence / 100,
			});
		}

		// Update session with final stats
		await prisma.analysisSession.update({
			where: { id: analysisSession.id },
			data: {
				status: SessionStatus.COMPLETED,
				totalComments: comments.length,
				totalParticipants: participantsData.length,
				contactSignalsFound: totalContactSignals,
				completedAt: new Date(),
			},
		});

		return analysisSession.id;
	} catch (error) {
		// Mark session as failed
		await prisma.analysisSession.update({
			where: { id: analysisSession.id },
			data: {
				status: SessionStatus.FAILED,
			},
		});
		throw error;
	}
}

function detectPlatform(url: string): Platform | null {
	if (url.includes('youtube.com') || url.includes('youtu.be')) {
		return Platform.YOUTUBE;
	}
	if (url.includes('reddit.com')) {
		return Platform.REDDIT;
	}
	if (url.includes('facebook.com')) {
		return Platform.FACEBOOK;
	}
	return null;
}

function getProfileUrl(
	platform: Platform,
	username: string,
	platformUserId?: string
): string {
	const cleanUsername = username.replace(/[^a-z0-9._-]/gi, '').toLowerCase();

	switch (platform) {
		case Platform.YOUTUBE:
			return platformUserId
				? `https://youtube.com/channel/${platformUserId}`
				: `https://youtube.com/@${cleanUsername}`;
		case Platform.REDDIT:
			return `https://reddit.com/user/${cleanUsername}`;
		case Platform.FACEBOOK:
			return platformUserId
				? `https://facebook.com/profile.php?id=${platformUserId}`
				: `https://facebook.com/${cleanUsername}`;
		default:
			return '#';
	}
}
