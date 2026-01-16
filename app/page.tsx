import UrlInput from '../components/UrlInput';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import Image from 'next/image';

export default async function Home() {
	const session = await requireAuth();

	// Get recent sessions for this user
	const recentSessions = await prisma.analysisSession.findMany({
		where: { userId: session.user.id },
		orderBy: { createdAt: 'desc' },
		take: 5,
		include: {
			_count: {
				select: { participants: true },
			},
		},
	});

	return (
		<main className='min-h-screen bg-neutral-50 p-8'>
			<div className='mx-auto max-w-4xl space-y-8'>
				<div className='flex items-center justify-between mb-4'>
					<h1 className='text-2xl font-semibold text-neutral-900'>
						Email Extractor
					</h1>
					<LogoutButton />
				</div>

				<div className='rounded-xl bg-white p-8 shadow-sm'>
					<p className='mt-2 text-sm text-neutral-600'>
						Paste a public post link to extract email addresses from
						post comments .
					</p>

					<div className='mt-6'>
						<UrlInput />
					</div>

					<p className='mt-6 text-xs text-neutral-500'>
						Emails are Extracted from posts participants using heuristic
						algorithms. We use a combination of machine learning and natural language processing to extract the emails.
					</p>
				</div>

				{recentSessions.length > 0 && (
					<div className='rounded-xl bg-white p-6 shadow-sm'>
						<h2 className='text-lg font-semibold text-neutral-900 mb-4'>
							Recent Sessions
						</h2>
						<div className='space-y-2'>
							{recentSessions.map((analysisSession) => (
								<Link
									key={analysisSession.id}
									href={`/session/${analysisSession.id}`}
									className='block rounded-lg border border-neutral-200 p-4 hover:bg-neutral-50 transition-colors'
								>
									<div className='flex items-center justify-between'>
										<div className='flex-1 min-w-0'>
											<p className='text-sm font-medium text-neutral-900 truncate'>
												{analysisSession.sourceUrl}
											</p>
											<p className='text-xs text-neutral-500 mt-1'>
												{analysisSession.totalParticipants ||
													0}{' '}
												participants •{' '}
												{analysisSession.contactSignalsFound ||
													0}{' '}
												emails •{' '}
												{new Date(
													analysisSession.createdAt
												).toLocaleDateString()}
											</p>
										</div>
										<span className='ml-4 text-xs text-purple-900 capitalize'>
										
											<Image src={`/${analysisSession.platform.toLowerCase()}.svg`} alt={analysisSession.platform.toLowerCase()} width={70} height={70} />
										</span>
									</div>
								</Link>
							))}
						</div>
					</div>
				)}
			</div>
		</main>
	);
}
