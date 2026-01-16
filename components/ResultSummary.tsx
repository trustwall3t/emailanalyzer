type ResultsSummaryProps = {
	participants: number;
	emailCount: number;
	explicit: number;
};

export default function ResultsSummary({
	participants,
	emailCount,
	explicit,
}: ResultsSummaryProps) {
	const metrics = [
		{ label: 'Participants', value: participants },
		{ label: 'Emails Found', value: emailCount },
		// { label: 'Inferred', value: emailCount - explicit },
	];

	return (
		<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
			{metrics.map((m) => (
				<div
					key={m.label}
					className='rounded-xl bg-white p-5 shadow-sm'
				>
					<p className='text-sm text-purple-900'>{m.label}</p>
					<p className='mt-1 text-2xl font-semibold text-purple-900'>
						{m.value}
					</p>
				</div>
			))}
		</div>
	);
}
