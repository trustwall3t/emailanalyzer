import { extractFacebookPostId } from '@/app/utils/Helpers';

export async function fetchFacebookComments(postUrl: string) {
	const postId = extractFacebookPostId(postUrl);

	if (!postId) {
		throw new Error('Invalid Facebook post ID');
	}

	if (!process.env.FACEBOOK_PAGE_TOKEN) {
		throw new Error('FACEBOOK_PAGE_TOKEN is not configured');
	}

	const res = await fetch(
		`https://graph.facebook.com/v18.0/${postId}/comments?` +
			new URLSearchParams({
				access_token: process.env.FACEBOOK_PAGE_TOKEN,
			})
	);

	if (!res.ok) {
		const errorData = await res.json().catch(() => ({}));
		throw new Error(
			`Facebook API error: ${errorData.error?.message || res.statusText}`
		);
	}

	const data = await res.json();

	if (!data.data || !Array.isArray(data.data)) {
		console.warn(
			'Facebook API returned no comments or invalid response:',
			data
		);
		return [];
	}

	return data.data.map((c: any) => ({
		username: c.from.name,
		comment: c.message,
		platformUserId: c.from.id,
	}));
}
