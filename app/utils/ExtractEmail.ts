/**
 * Extracts email addresses from text using regex pattern matching
 * @param text - The text to search for email addresses
 * @returns Array of unique email addresses found in the text
 */
export function extractEmailsFromText(text: string): string[] {
	if (!text || typeof text !== 'string') {
		return [];
	}

	// Email regex pattern - matches standard email formats
	// Matches: user@domain.com, user.name@domain.co.uk, etc.
	const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

	const matches = text.match(emailRegex);
	if (!matches) {
		return [];
	}

	// Filter out common false positives and normalize
	const validEmails = matches
		.map((email) => email.toLowerCase().trim())
		.filter((email) => {
			// Filter out common false positives
			const lowerEmail = email.toLowerCase();
			return (
				!lowerEmail.includes('example.com') &&
				!lowerEmail.includes('test@') &&
				!lowerEmail.includes('example@') &&
				!lowerEmail.endsWith('.png') &&
				!lowerEmail.endsWith('.jpg') &&
				!lowerEmail.endsWith('.gif') &&
				!lowerEmail.endsWith('.svg') &&
				email.length > 5 && // Minimum reasonable email length
				email.includes('@') &&
				email.split('@')[1]?.includes('.') // Has domain with TLD
			);
		});

	// Return unique emails
	return Array.from(new Set(validEmails));
}

