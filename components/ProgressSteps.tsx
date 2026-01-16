export default function ProgressSteps() {
	const steps = [
		'Classifying link',
		'Loading comment stream',
		'Analyzing participants',
		'Discovering emails',
		'Scoring confidence',
	];

	return (
		<ul className='space-y-3'>
			{steps.map((step, i) => (
				<li
					key={step}
					className='flex items-center gap-3 text-sm'
				>
					<span className='h-2 w-2 rounded-full bg-neutral-900' />
					{step}
				</li>
			))}
		</ul>
	);
}
