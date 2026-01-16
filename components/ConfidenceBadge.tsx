export default function ConfidenceBadge({ value }: { value: number }) {
	const label = value > 0.85 ? 'High' : value > 0.6 ? 'Medium' : 'Low';

	return (
		<span className='rounded-full bg-neutral-900 px-3 py-1 text-xs text-white'>
			{label} ({Math.round(value * 100)}%)
		</span>
	);
}
