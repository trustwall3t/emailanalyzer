# Environment Variables Setup

## Required Environment Variables

Add these to your `.env` or `.env.local` file:

```env
# Database (already set)
DATABASE_URL="your-database-url"

# NextAuth Secret (REQUIRED - generate one with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# API Keys (see API_KEYS_SETUP.md for details)
YOUTUBE_API_KEY="your-youtube-api-key"
REDDIT_ACCESS_TOKEN="your-reddit-access-token"
FACEBOOK_PAGE_TOKEN="your-facebook-page-token"

# Admin User (optional - defaults shown)
ADMIN_EMAIL="admin@emailextractor.com"
ADMIN_PASSWORD="admin123"
```

## Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Copy the output and add it to your `.env` file as `NEXTAUTH_SECRET`.

## Quick Setup

1. Copy the generated secret above
2. Add it to your `.env` file:
   ```env
   NEXTAUTH_SECRET="paste-generated-secret-here"
   ```
3. Restart your dev server

