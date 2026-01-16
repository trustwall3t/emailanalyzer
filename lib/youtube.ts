import { extractYouTubeVideoId } from '@/app/utils/Helpers';

export async function fetchYouTubeComments(videoUrl: string) {
	const videoId = extractYouTubeVideoId(videoUrl);
	if (!videoId) {
		throw new Error('Invalid YouTube video ID');
	}

	if (!process.env.YOUTUBE_API_KEY) {
		throw new Error('YOUTUBE_API_KEY is not configured');
	}

	const params = new URLSearchParams({
		part: 'snippet',
		videoId,
		maxResults: '500',
		key: process.env.YOUTUBE_API_KEY,
	});

	const res = await fetch(
		`https://www.googleapis.com/youtube/v3/commentThreads?${params.toString()}`
	);

	if (!res.ok) {
		const errorData = await res.json().catch(() => ({}));
		throw new Error(
			`YouTube API error: ${errorData.error?.message || res.statusText}`
		);
	}

	const data = await res.json();

	if (!data.items || !Array.isArray(data.items)) {
		console.warn(
			'YouTube API returned no comments or invalid response:',
			data
		);
		return [];
	}

	return data.items.map((item: any) => ({
		username: item.snippet.topLevelComment.snippet.authorDisplayName,
		comment: item.snippet.topLevelComment.snippet.textDisplay,
		platformUserId:
			item.snippet.topLevelComment.snippet.authorChannelId?.value,
	}));
}
