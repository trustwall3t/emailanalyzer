import { signIn } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return NextResponse.json(
				{ error: 'Email and password are required' },
				{ status: 400 }
			);
		}

		const result = await signIn('credentials', {
			email,
			password,
			redirect: false,
		});

		if (result?.error) {
			return NextResponse.json(
				{ error: result.error },
				{ status: 401 }
			);
		}

		return NextResponse.json({ success: true });
	} catch (error: any) {
		console.error('Sign in error:', error);
		return NextResponse.json(
			{ error: error?.message || 'Authentication failed' },
			{ status: 500 }
		);
	}
}

