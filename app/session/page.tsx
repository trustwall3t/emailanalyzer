import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function SessionsPage() {
	const session = await requireAuth();

	const sessions = await prisma.analysisSession.findMany({
		where: { userId: session.user.id },
		orderBy: { createdAt: 'desc' },
		include: {
			_count: {
				select: { participants: true },
			},
		},
	});

	return (
		<main className='min-h-screen bg-neutral-50 p-8'>
			<div className='mx-auto max-w-4xl space-y-4'>
				<h1 className='text-xl font-semibold text-neutral-900'>
					Analysis Sessions
				</h1>

				{sessions.length === 0 ? (
					<div className='rounded-lg bg-white p-8 text-center shadow-sm'>
						<p className='text-neutral-600'>No sessions found</p>
					</div>
				) : (
					sessions.map((s) => (
						<Link
							key={s.id}
							href={`/session/${s.id}`}
							className='block rounded-lg bg-white p-4 shadow-sm hover:bg-neutral-50 transition-colors'
						>
							<div className='flex items-center justify-between'>
								<div className='flex-1 min-w-0'>
									<p className='text-sm font-medium text-neutral-900 truncate'>
										{s.sourceUrl}
									</p>
									<p className='text-xs text-neutral-500 mt-1'>
										{new Date(s.createdAt).toLocaleDateString()} •{' '}
										{s.totalParticipants || 0} participants
									</p>
								</div>
								<div className='ml-4 text-right'>
									<p className='text-sm font-medium text-purple-900'>
										{s.contactSignalsFound || 0} emails
									</p>
									<p className='text-xs text-neutral-500 capitalize'>
										{s.platform.toLowerCase()}
									</p>
								</div>
							</div>
						</Link>
					))
				)}
			</div>
		</main>
	);
}
