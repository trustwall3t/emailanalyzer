export async function fetchRedditComments(postUrl: string) {
	if (!process.env.REDDIT_ACCESS_TOKEN) {
		throw new Error('REDDIT_ACCESS_TOKEN is not configured');
	}

	const apiUrl = postUrl.replace('www.reddit.com', 'oauth.reddit.com');

	const res = await fetch(`${apiUrl}.json`, {
		headers: {
			Authorization: `Bearer ${process.env.REDDIT_ACCESS_TOKEN}`,
			'User-Agent': 'EmailExtractor/1.0',
		},
	});

	if (!res.ok) {
		const errorData = await res.json().catch(() => ({}));
		throw new Error(
			`Reddit API error: ${errorData.message || res.statusText}`
		);
	}

	const data = await res.json();

	if (!data || !Array.isArray(data) || !data[1] || !data[1].data) {
		console.warn('Reddit API returned invalid response:', data);
		return [];
	}

	const comments = data[1].data.children;

	if (!comments || !Array.isArray(comments)) {
		return [];
	}

	return comments.map((c: any) => ({
		username: c.data.author,
		comment: c.data.body,
		platformUserId: c.data.author_fullname,
	}));
}
