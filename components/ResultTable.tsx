'use client';
import { useState, useEffect } from 'react';
import ConfidenceBadge from './ConfidenceBadge';
import { IoCopyOutline, IoCheckmarkCircle } from 'react-icons/io5';

type EmailData = {
	user: string;
	email: string;
	confidence: number;
	snippet?: string;
};

type ResultsTableProps = {
	emails: EmailData[];
};

export default function ResultsTable({ emails }: ResultsTableProps) {
	const [showToast, setShowToast] = useState(false);

	useEffect(() => {
		if (showToast) {
			const timer = setTimeout(() => {
				setShowToast(false);
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [showToast]);

	const maskEmail = (email: string) => {
		const [local, domain] = email.split('@');
		if (local.length <= 3) {
			return `${local[0]}***@${domain}`;
		}
		return `${local.substring(0, 1)}***@${domain}`;
	};

	const handleCopy = async (email: string) => {
		try {
			await navigator.clipboard.writeText(email);
			setShowToast(true);
		} catch (err) {
			console.error('Failed to copy email:', err);
		}
	};

	if (emails.length === 0) {
		return (
			<div className='rounded-xl bg-white shadow-sm p-8 text-center'>
				<p className='text-neutral-600'>No emails found</p>
			</div>
		);
	}

	return (
		<div className='relative'>
			{/* Toast Notification */}
			{showToast && (
				<div className='fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300'>
					<div className='bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[200px]'>
						<IoCheckmarkCircle className='w-5 h-5 shrink-0' />
						<span className='text-sm font-medium'>
							Email copied!
						</span>
					</div>
				</div>
			)}

			<div className='rounded-xl bg-white shadow-sm overflow-hidden'>
				{/* Desktop Table View */}
				<div className='hidden md:block overflow-x-auto'>
					<table className='w-full text-sm'>
						<thead className='bg-neutral-100'>
							<tr>
								<th className='px-4 py-3 text-left text-purple-900'>
									Participant
								</th>
								<th className='px-4 py-3 text-left text-purple-900'>
									Email
								</th>
							</tr>
						</thead>
						<tbody>
							{emails.map((emailData, index) => (
								<tr
									key={`${emailData.user}-${index}`}
									className='border-t text-purple-900'
								>
									<td className='px-4 py-3'>
										{emailData.user}
									</td>
									<td className='px-4 py-3'>
										<div className='flex items-center gap-x-3'>
											<span className='break-all'>
												{maskEmail(emailData.email)}
											</span>
											<button
												onClick={() =>
													handleCopy(emailData.email)
												}
												className='text-neutral-600 hover:text-purple-900 transition-colors shrink-0'
												title='Copy email'
											>
												<IoCopyOutline className='w-4 h-4' />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Mobile Card View */}
				<div className='md:hidden divide-y divide-neutral-200'>
					{emails.map((emailData, index) => (
						<div
							key={`${emailData.user}-${index}`}
							className='p-4 space-y-2'
						>
							<div className='flex items-start justify-between gap-2'>
								<div className='flex-1 min-w-0'>
									<p className='text-sm font-medium text-purple-900 truncate'>
										{emailData.user}
									</p>
								</div>
							</div>
							<div className='flex items-center gap-2'>
								<span className='text-sm text-neutral-700 break-all flex-1'>
									{maskEmail(emailData.email)}
								</span>
								<button
									onClick={() => handleCopy(emailData.email)}
									className='text-neutral-600 hover:text-purple-900 transition-colors shrink-0 p-1'
									title='Copy email'
								>
									<IoCopyOutline className='w-5 h-5' />
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
