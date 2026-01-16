import { Platform } from '@prisma/client';

export function detectPlatform(url: string): Platform | null {
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
