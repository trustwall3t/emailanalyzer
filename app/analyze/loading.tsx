import ProgressSteps from '../../components/ProgressSteps';

export default function Loading() {
	return (
		<main className='min-h-screen flex items-center justify-center bg-neutral-50'>
			<div className='w-full max-w-lg rounded-xl bg-white p-8 shadow-sm'>
				<h2 className='text-lg font-semibold'>Analyzing comments</h2>
				<p className='mt-1 text-sm text-neutral-600'>
					Simulating participant analysis…
				</p>

				<div className='mt-6'>
					<ProgressSteps />
				</div>
			</div>
		</main>
	);
}
