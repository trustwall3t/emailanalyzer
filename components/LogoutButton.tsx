'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
	const router = useRouter();

	const handleLogout = async () => {
		await fetch('/api/auth/signout', { method: 'POST' });
		router.push('/login');
		router.refresh();
	};

	return (
		<button
			onClick={handleLogout}
			className='text-sm text-neutral-600 hover:text-neutral-900 transition-colors'
		>
			Logout
		</button>
	);
}

