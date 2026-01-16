'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteSession } from '@/app/actions/deletesession';
import { BiTrash } from 'react-icons/bi';

export default function DeleteSessionButton({
	sessionId,
}: {
	sessionId: string;
}) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const router = useRouter();

	const handleDelete = async () => {
		if (!showConfirm) {
			setShowConfirm(true);
			return;
		}

		setIsDeleting(true);
		try {
			const result = await deleteSession(sessionId);
			if (result?.success) {
				// Redirect to home page after successful deletion
				router.push('/');
				router.refresh();
			}
		} catch (error) {
			console.error('Failed to delete session:', error);
			setIsDeleting(false);
			setShowConfirm(false);
			alert('Failed to delete session. Please try again.');
		}
	};

	if (showConfirm) {
		return (
			<div className='flex items-center gap-2'>
				<button
					onClick={() => setShowConfirm(false)}
					disabled={isDeleting}
					className='px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 disabled:opacity-50'
				>
					Cancel
				</button>
				<button
					onClick={handleDelete}
					disabled={isDeleting}
					className='px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5'
				>
					{isDeleting ? (
						<>
							<span className='animate-spin'>⏳</span>
							Deleting...
						</>
					) : (
						<>
							<BiTrash className='w-4 h-4' />
							Confirm Delete
						</>
					)}
				</button>
			</div>
		);
	}

	return (
		<button
			onClick={handleDelete}
			disabled={isDeleting}
			className='px-3 py-1.5 text-sm bg-red-50 md:bg-transparent text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex items-center md:gap-1.5'
			title='Delete session'
		>
			<BiTrash className='w-4 h-4' />
			Delete Session
		</button>
	);
}
