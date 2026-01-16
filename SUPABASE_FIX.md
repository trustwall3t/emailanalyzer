# Fix for Supabase Connection Issues

## The Problem

`prisma db push` doesn't work with Supabase's pgbouncer connection pooler because:
- Prisma uses prepared statements
- Pgbouncer doesn't support prepared statements well
- This causes the "prepared statement 's1' already exists" error

## Solution: Use Prisma Migrate Instead

Prisma Migrate works better with connection poolers. Here's how to fix it:

### Option 1: Use Migrations (Recommended)

1. **Create your first migration:**
   ```bash
   npm run db:migrate
   ```
   When prompted, name it something like "init"

2. **This will:**
   - Create a migration file in `prisma/migrations/`
   - Apply it to your database
   - Work properly with Supabase's pooler

### Option 2: Get Direct Connection String

If you still want to use `db push`, you need the **direct connection** (not pooler):

1. Go to your Supabase dashboard
2. Settings → Database
3. Under "Connection string", select **"Direct connection"** (port 5432)
4. Copy that connection string
5. Add it to `.env` as `DATABASE_URL_DIRECT`
6. Temporarily use it for migrations

### Option 3: Update Config to Use Direct Connection

You can modify `prisma.config.js` to automatically use direct connection for migrations.

## Quick Fix Right Now

Run this command instead of `db:push`:

```bash
npm run db:migrate
```

This should work with your current pooler connection string.

