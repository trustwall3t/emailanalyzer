'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import PlatformBadge from './PlatformBadge';
import { analyzeLink } from '@/app/actions/analyzelink';
import { BiInfoCircle } from 'react-icons/bi';

export default function UrlInput() {
	const [url, setUrl] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const platform = url.includes('youtu.be')
		? 'youtu.be'
		: url.includes('reddit')
		? 'reddit'
		: url.includes('facebook')
		? 'facebook'
		: url.includes('youtube')
		? 'youtube'
		: null;

	const isUnsupportedPlatform =
		platform === 'reddit' || platform === 'facebook';
	const unsupportedPlatformName =
		platform === 'reddit' ? 'Reddit' : 'Facebook';

	const handleSubmit = () => {
		setError(null);

		if (!url.trim()) {
			setError('Please enter a valid link');
			return;
		}

		if (isUnsupportedPlatform) {
			setError(
				`${unsupportedPlatformName} is not yet supported. Please use YouTube links for now.`
			);
			return;
		}

		startTransition(async () => {
			try {
				const result = await analyzeLink({ sourceUrl: url });
				router.push(`/session/${result}`);
			} catch (err) {
				setError('Failed to analyze link');
			}
		});
	};

	return (
		<div className='space-y-4'>
			<input
				value={url}
				onChange={(e) => setUrl(e.target.value)}
				placeholder='https://youtube.com/watch?v=...'
				className='w-full text-black rounded-lg border border-neutral-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900'
			/>

			{platform && <PlatformBadge platform={platform} />}

			{isUnsupportedPlatform && (
				<div className='rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start gap-3'>
					<BiInfoCircle className='w-5 h-5 text-amber-600 shrink-0 mt-0.5' />
					<div className='flex-1'>
						<p className='text-sm font-medium text-amber-900'>
							{unsupportedPlatformName} support coming soon
						</p>
						<p className='text-xs text-amber-700 mt-1'>
							{unsupportedPlatformName} integration is currently
							under development. Please use YouTube links for now.
						</p>
					</div>
				</div>
			)}

			{error && (
				<div className='rounded-lg bg-red-50 border border-red-200 p-4'>
					<p className='text-sm text-red-800'>{error}</p>
				</div>
			)}

			<button
				onClick={handleSubmit}
				disabled={!platform || isPending || isUnsupportedPlatform}
				className='w-full rounded-lg bg-purple-900 py-3 text-sm font-medium text-white disabled:opacity-40'
			>
				{isPending ? 'Extracting Emails...' : 'Extract Emails'}
			</button>
		</div>
	);
}
