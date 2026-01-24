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
import { extractEmailsFromText } from '../utils/ExtractEmail';

// Priority email domains - Gmail, Yahoo, and Outlook have top priority
const PRIORITY_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com'];

/**
 * Sorts emails to prioritize Gmail, Yahoo, and Outlook domains
 * Emails from priority domains appear first in the array
 */
function prioritizeEmails(emails: string[]): string[] {
	return emails.sort((a, b) => {
		const domainA = a.split('@')[1]?.toLowerCase() || '';
		const domainB = b.split('@')[1]?.toLowerCase() || '';
		
		const isPriorityA = PRIORITY_EMAIL_DOMAINS.includes(domainA);
		const isPriorityB = PRIORITY_EMAIL_DOMAINS.includes(domainB);
		
		// Priority emails come first
		if (isPriorityA && !isPriorityB) return -1;
		if (!isPriorityA && isPriorityB) return 1;
		
		// If both are priority or both are not, maintain original order
		return 0;
	});
}

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

		// Group comments by username to aggregate and avoid duplicates
		const commentsByUser = new Map<
			string,
			{
				username: string;
				comments: string[];
				platformUserId?: string;
				extractedEmails: Set<string>;
			}
		>();

		// Process all comments and group by user
		for (const comment of comments) {
			const username = comment.username;
			const existing = commentsByUser.get(username);

			// Extract emails from this comment
			const extractedEmails = extractEmailsFromText(comment.comment);

			if (existing) {
				// User already exists, aggregate their comments
				existing.comments.push(comment.comment);
				extractedEmails.forEach((email) => existing.extractedEmails.add(email));
				// Keep the first platformUserId we encounter
				if (!existing.platformUserId && comment.platformUserId) {
					existing.platformUserId = comment.platformUserId;
				}
			} else {
				// New user
				commentsByUser.set(username, {
					username,
					comments: [comment.comment],
					platformUserId: comment.platformUserId,
					extractedEmails: new Set(extractedEmails),
				});
			}
		}

		// Process each unique participant
		const participantsData = [];
		let totalContactSignals = 0;

		for (const [username, userData] of commentsByUser) {
			// Get the first comment snippet for display
			const firstComment = userData.comments[0];
			const commentSnippet = firstComment.substring(0, 200);

			// Create participant with aggregated comment count
			const participant = await prisma.participant.create({
				data: {
					sessionId: analysisSession.id,
					username: userData.username,
					displayName: capitalize(userData.username),
					profileUrl: getProfileUrl(
						platform,
						userData.username,
						userData.platformUserId
					),
					commentSnippet,
					commentCount: userData.comments.length, // Total comments from this user
				},
			});

			// If we found emails in any of the user's comments, use those (high confidence)
			if (userData.extractedEmails.size > 0) {
				// Prioritize emails - Gmail, Yahoo, and Outlook come first
				const emailsArray = prioritizeEmails(Array.from(userData.extractedEmails));
				for (let i = 0; i < emailsArray.length; i++) {
					const email = emailsArray[i];
					await prisma.contactSignal.create({
						data: {
							participantId: participant.id,
							type: ContactType.EMAIL,
							value: email,
							source: SignalSource.EXPLICIT_COMMENT,
							confidence: 95, // High confidence for explicit emails
							isPrimary: i === 0, // First email is primary
							isMasked: true,
						},
					});
					totalContactSignals++;
				}

				participantsData.push({
					id: participant.id,
					username: participant.username,
					email: emailsArray[0], // Use first extracted email
					confidence: 0.95,
				});
			} else {
				// Fall back to inferred email from username (lower confidence)
				const inferredEmail = inferEmailFromUsername(userData.username, platform);
				const confidence = Math.floor(Math.random() * 20) + 55; // 55-75% confidence

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
		// Log the error for debugging
		console.error('Error analyzing link:', {
			url: sourceUrl,
			platform,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		// Mark session as failed
		await prisma.analysisSession.update({
			where: { id: analysisSession.id },
			data: {
				status: SessionStatus.FAILED,
			},
		});

		// Re-throw with a more user-friendly message
		if (error instanceof Error) {
			throw new Error(
				`Failed to analyze ${platform.toLowerCase()} link: ${error.message}`
			);
		}
		throw new Error(`Failed to analyze link: ${String(error)}`);
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
