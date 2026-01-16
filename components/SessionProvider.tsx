'use client';

// In NextAuth v5, SessionProvider is not needed for server components
// But we keep this for any client components that might need it
export default function SessionProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}

