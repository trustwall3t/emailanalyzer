'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			const response = await fetch('/api/auth/callback/credentials', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email,
					password,
					redirect: false,
				}),
			});

			const data = await response.json();

			if (response.ok && !data.error) {
				router.push('/');
				router.refresh();
			} else {
				setError(data.error || 'Invalid email or password');
			}
		} catch (err) {
			console.error('Login error:', err);
			setError('An error occurred. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<main
			className='min-h-screen flex items-center justify-center bg-neutral-50'
			style={{ pointerEvents: 'auto' }}
		>
			<div
				className='w-full max-w-md rounded-xl bg-white p-8 shadow-sm'
				style={{ pointerEvents: 'auto' }}
			>
				<h1 className='text-2xl font-semibold text-neutral-900'>
					Admin Login
				</h1>

				<p className='mt-2 text-sm text-neutral-600'>
					Sign in to access the Email Extractor
				</p>

				<form
					onSubmit={handleSubmit}
					className='mt-6 space-y-4'
					style={{ pointerEvents: 'auto' }}
				>
					<div>
						<label
							htmlFor='email'
							className='block text-sm font-medium text-neutral-700 mb-1'
						>
							Email
						</label>
						<input
							id='email'
							type='email'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className='w-full text-black rounded-lg border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-900'
							placeholder='admin@example.com'
						/>
					</div>

					<div>
						<label
							htmlFor='password'
							className='block text-sm font-medium text-neutral-700 mb-1'
						>
							Password
						</label>
						<input
							id='password'
							type='password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className='w-full text-black rounded-lg border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-900'
							placeholder='••••••••'
						/>
					</div>

					{error && (
						<div className='rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700'>
							{error}
						</div>
					)}

					<button
						type='submit'
						disabled={isLoading}
						className='w-full rounded-lg bg-purple-900 py-3 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-800 transition-colors'
						style={{
							pointerEvents: isLoading ? 'none' : 'auto',
							cursor: isLoading ? 'not-allowed' : 'pointer',
						}}
					>
						{isLoading ? 'Signing in...' : 'Sign In'}
					</button>
				</form>
			</div>
		</main>
	);
}
