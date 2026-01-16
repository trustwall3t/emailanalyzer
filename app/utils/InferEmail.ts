import { Platform } from '@prisma/client';

export default function inferEmailFromUsername(
	username: string,
	platform?: Platform
) {
	// For YouTube links, only return gmail.com emails
	if (platform === Platform.YOUTUBE) {
		const domain = 'gmail.com';
		return `${username.replace(/[^a-z0-9]/gi, '').toLowerCase()}@${domain}`;
	}

	// For other platforms, use random domain selection
	const domains = ['gmail.com', 'yahoo.com', 'outlook.com'];
	const domain = domains[Math.floor(Math.random() * domains.length)];

	return `${username.replace(/[^a-z0-9]/gi, '').toLowerCase()}@${domain}`;
}
