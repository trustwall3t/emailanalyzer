import Image from 'next/image';

const PlatformBadge = ({ platform }: { platform: string }) => {
	const getImagePath = (platform: string): string => {
		const normalized = platform.toLowerCase();
		if (normalized === 'youtube' || normalized === 'youtu.be') {
			return '/YouTube.svg';
		}
		if (normalized === 'reddit') {
			return '/Reddit.svg';
		}
		if (normalized === 'facebook') {
			return '/Facebook.svg';
		}
		return '/YouTube.svg'; // default fallback
	};

	return (
		<div>
			<Image
				src={getImagePath(platform)}
				width={100}
				height={100}
				alt={platform}
			/>
		</div>
	);
};

export default PlatformBadge;
