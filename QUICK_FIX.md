# Quick Fix for Stuck Database Command

## Why It's Stuck

The `npm run db:push` command hangs because:
- Supabase uses **pgbouncer** (connection pooler on port 6543)
- `prisma db push` uses **prepared statements**
- Pgbouncer doesn't support prepared statements well
- This causes the command to hang or error

## Solution: Get Direct Connection String

1. **Go to Supabase Dashboard:**
   - Open your project
   - Go to **Settings** → **Database**

2. **Get Direct Connection:**
   - Scroll to "Connection string"
   - Select **"Direct connection"** (NOT "Connection pooling")
   - Copy the connection string (it will have port **5432**, not 6543)

3. **Add to `.env` file:**
   ```env
   DATABASE_URL_DIRECT="postgresql://postgres.xxx:password@aws-1-eu-north-1.supabase.co:5432/postgres"
   ```

4. **Run migration:**
   ```bash
   npm run db:migrate
   ```

The config file will automatically use `DATABASE_URL_DIRECT` if available, otherwise fall back to `DATABASE_URL`.

## Alternative: Use Migrations Instead

Even with pooler, migrations work better:
```bash
npm run db:migrate -- --name init
```

