import { Platform } from '@prisma/client';

// Priority domains with higher weights
const PRIORITY_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com'];
const OTHER_DOMAINS = ['hotmail.com', 'icloud.com', 'protonmail.com', 'zoho.com', 'yandex.com', 'aol.com'];

/**
 * Selects a domain with priority for Gmail, Yahoo, and Outlook
 * Priority domains have 75% chance, other domains have 25% chance
 */
function selectDomainWithPriority(): string {
	const random = Math.random();
	
	// 75% chance for priority domains (gmail, yahoo, outlook)
	if (random < 0.75) {
		return PRIORITY_DOMAINS[Math.floor(Math.random() * PRIORITY_DOMAINS.length)];
	}
	
	// 25% chance for other domains
	return OTHER_DOMAINS[Math.floor(Math.random() * OTHER_DOMAINS.length)];
}

export default function inferEmailFromUsername(
	username: string,
	platform?: Platform
) {
	// For YouTube links, only return gmail.com emails
	if (platform === Platform.YOUTUBE) {
		const domain = 'gmail.com';
		return `${username.replace(/[^a-z0-9]/gi, '').toLowerCase()}@${domain}`;
	}

	// For other platforms, use priority-based domain selection
	const domain = selectDomainWithPriority();

	return `${username.replace(/[^a-z0-9]/gi, '').toLowerCase()}@${domain}`;
}
