import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { notFound } from 'next/navigation';
import ResultsSummary from '@/components/ResultSummary';
import ResultsTable from '@/components/ResultTable';
import PlatformBadge from '@/components/PlatformBadge';
import DeleteSessionButton from '@/components/DeleteSessionButton';
import Link from 'next/link';
import { BiArrowBack } from 'react-icons/bi';

export default async function SessionPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const session = await requireAuth();
	const { id } = await params;

	const analysisSession = await prisma.analysisSession.findUnique({
		where: { id },
		include: {
			participants: {
				include: {
					contactSignals: {
						where: { isPrimary: true },
					},
				},
			},
		},
	});

	if (!analysisSession) {
		notFound();
	}

	// Verify the session belongs to the current user
	if (analysisSession.userId !== session.user.id) {
		notFound();
	}

	// Prepare email data for the table
	const emails = analysisSession.participants
		.map((participant) => {
			const primarySignal = participant.contactSignals[0];
			if (!primarySignal) return null;

			return {
				user: participant.username,
				email: primarySignal.value,
				confidence: primarySignal.confidence / 100,
				snippet: participant.commentSnippet || '',
			};
		})
		.filter((email): email is NonNullable<typeof email> => email !== null);

	// Calculate summary stats
	const explicitCount = analysisSession.participants.filter((p) =>
		p.contactSignals.some((s) => s.source === 'EXPLICIT_COMMENT')
	).length;

	const platformName =
		analysisSession.platform.toLowerCase() === 'youtube'
			? 'youtu.be'
			: analysisSession.platform.toLowerCase();

	return (
		<main className='min-h-screen bg-neutral-50 p-8 relative'>
			<Link
				href='/'
				className='fixed top-4 left-4 bg-purple-900 text-white rounded-full p-2'
			>
				<BiArrowBack className='w-4 h-4' />
			</Link>
			<div className='mx-auto max-w-6xl space-y-8'>
				<div className='flex items-center justify-between'>
					<div>
						<h1 className='text-2xl font-semibold text-neutral-900'>
							Analysis Results
						</h1>
						<p className='mt-1 text-sm text-neutral-600'>
							{analysisSession.sourceUrl}
						</p>
					</div>
					<div className='flex-col md:flex-row flex items-center gap-4'>
						<PlatformBadge platform={platformName} />
						<DeleteSessionButton sessionId={id} />
					</div>
				</div>

				<ResultsSummary
					participants={analysisSession.totalParticipants || 0}
					emailCount={analysisSession.contactSignalsFound || 0}
					explicit={explicitCount}

				/>

				<ResultsTable emails={emails} platform={platformName} />
			</div>
		</main>
	);
}
