# Setup Guide

Follow these steps to set up the Email Extractor application.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- API keys for YouTube, Reddit, and Facebook (see [API_KEYS_SETUP.md](./API_KEYS_SETUP.md))

## Step 1: Install Dependencies

```bash
cd app
npm install
```

## Step 2: Set Up Environment Variables

Create a `.env.local` file in the `app` directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/email_extractor"

# NextAuth
NEXTAUTH_SECRET="generate-a-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# YouTube API
YOUTUBE_API_KEY="your-youtube-api-key"

# Reddit API
REDDIT_ACCESS_TOKEN="your-reddit-access-token"

# Facebook API
FACEBOOK_PAGE_TOKEN="your-facebook-page-access-token"

# Admin User (optional - defaults shown)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
```

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## Step 3: Set Up Database

1. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```

2. **Push Schema to Database:**
   ```bash
   npm run db:push
   ```

   Or create a migration:
   ```bash
   npm run db:migrate
   ```

## Step 4: Create Admin User

```bash
npm run seed:admin
```

This creates an admin user with:
- Email: `admin@example.com` (or from `ADMIN_EMAIL` env var)
- Password: `admin123` (or from `ADMIN_PASSWORD` env var)

**⚠️ Important:** Change the default password after first login!

## Step 5: Configure API Keys

Follow the detailed guide in [API_KEYS_SETUP.md](./API_KEYS_SETUP.md) to obtain and configure:
- YouTube API Key
- Reddit Access Token
- Facebook Page Access Token

## Step 6: Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 7: Login

1. You'll be redirected to `/login`
2. Use the admin credentials created in Step 4
3. After login, you'll see the Email Extractor dashboard

## Usage

1. **Extract Emails:**
   - Paste a YouTube, Reddit, or Facebook post URL
   - Click "Extract Emails"
   - Wait for the analysis to complete
   - View results on the session page

2. **View Sessions:**
   - Recent sessions appear on the home page
   - Click any session to view detailed results
   - Visit `/session` to see all sessions

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check database credentials

### Prisma Client Errors

If you see errors about missing Prisma types:
```bash
npm run db:generate
```

### Authentication Issues

- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Ensure admin user exists: `npm run seed:admin`

### API Key Issues

- Check API keys are set in `.env.local`
- Verify keys are valid (see [API_KEYS_SETUP.md](./API_KEYS_SETUP.md))
- Check API quotas haven't been exceeded

## Production Deployment

1. Set environment variables in your hosting platform
2. Run database migrations: `npm run db:migrate`
3. Seed admin user: `npm run seed:admin`
4. Build: `npm run build`
5. Start: `npm start`

## Security Notes

- Never commit `.env.local` to version control
- Use strong passwords for admin accounts
- Rotate API keys regularly
- Use environment-specific keys for production
- Consider implementing rate limiting for API calls

