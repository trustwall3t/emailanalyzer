import ResultsSummary from '../../components/ResultSummary';
import ResultsTable from '../../components/ResultTable';

export default function ResultsPage() {
	return (
		<main className='min-h-screen bg-neutral-50 p-8'>
			<div className='mx-auto max-w-6xl space-y-8'>
				<ResultsSummary />
				<ResultsTable  />
			</div>
		</main>
	);
}
