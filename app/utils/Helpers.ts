import { Platform } from "@prisma/client";


export  function randomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export  function generateUsername(platform: Platform) {
	const base = ['alex', 'john', 'sam', 'mike', 'linda', 'sarah', 'david'];
	const suffix = randomInt(10, 999);

	return `${base[Math.floor(Math.random() * base.length)]}${suffix}`;
}

export  function generateComment(platform: Platform) {
	const samples = {
		YOUTUBE: [
			'Great breakdown, thanks for this.',
			'This explains a lot.',
			'I disagree with this take.',
		],
		REDDIT: [
			'This is underrated.',
			'OP makes a solid point.',
			'I had the same experience.',
		],
		FACEBOOK: [
			'Very insightful.',
			'Thanks for sharing.',
			'This helped me a lot.',
		],
	};

	return samples[platform][
		Math.floor(Math.random() * samples[platform].length)
	];
}

export function capitalize(str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}


export function extractFacebookPostId(url: string): string | null {
	try {
		const parsed = new URL(url);

		// permalink.php?story_fbid=POST_ID
		if (parsed.pathname === '/permalink.php') {
			return parsed.searchParams.get('story_fbid');
		}

		const segments = parsed.pathname.split('/').filter(Boolean);

		// /{page}/posts/{postId}
		const postIndex = segments.indexOf('posts');
		if (postIndex !== -1 && segments[postIndex + 1]) {
			return segments[postIndex + 1];
		}

		// /{page}/videos/{postId}
		const videoIndex = segments.indexOf('videos');
		if (videoIndex !== -1 && segments[videoIndex + 1]) {
			return segments[videoIndex + 1];
		}

		// /groups/{groupId}/posts/{postId}
		const groupIndex = segments.indexOf('groups');
		if (groupIndex !== -1 && segments[groupIndex + 2] === 'posts') {
			return segments[groupIndex + 3];
		}

		return null;
	} catch {
		return null;
	}
}


export function extractYouTubeVideoId(url: string): string | null {
	try {
		const parsed = new URL(url);

		// youtu.be/VIDEO_ID
		if (parsed.hostname === 'youtu.be') {
			return parsed.pathname.slice(1);
		}

		// youtube.com/watch?v=VIDEO_ID
		if (parsed.searchParams.has('v')) {
			return parsed.searchParams.get('v');
		}

		// youtube.com/shorts/VIDEO_ID
		if (parsed.pathname.startsWith('/shorts/')) {
			return parsed.pathname.split('/shorts/')[1];
		}

		// youtube.com/embed/VIDEO_ID
		if (parsed.pathname.startsWith('/embed/')) {
			return parsed.pathname.split('/embed/')[1];
		}

		return null;
	} catch {
		return null;
	}
}
