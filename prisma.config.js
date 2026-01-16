require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

let databaseUrl = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error(
		'DATABASE_URL is not set. Please create a .env.local file with DATABASE_URL=your_connection_string\n' +
		'For Supabase, use DATABASE_URL_DIRECT for migrations (direct connection, port 5432)'
	);
}

// Auto-convert pooler connection to direct connection for migrations
// This helps when DATABASE_URL_DIRECT is not set
if (databaseUrl.includes('pooler.supabase.com') && databaseUrl.includes(':6543')) {
	// Extract the region prefix (e.g., "aws-1-eu-north-1")
	const match = databaseUrl.match(/([^.]+)\.pooler\.supabase\.com/);
	if (match) {
		const regionPrefix = match[1];
		// Convert pooler to direct connection with SSL
		const urlObj = new URL(databaseUrl);
		urlObj.hostname = `${regionPrefix}.supabase.co`;
		urlObj.port = '5432';
		urlObj.searchParams.delete('pgbouncer');
		urlObj.searchParams.set('sslmode', 'require');
		databaseUrl = urlObj.toString();
		console.log('ℹ️  Auto-converted pooler connection to direct connection for migrations');
		console.log('   For better reliability, set DATABASE_URL_DIRECT in your .env file\n');
	}
}

module.exports = {
	datasource: {
		url: databaseUrl,
	},
};

