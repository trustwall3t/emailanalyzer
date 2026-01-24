# API Keys Setup Guide

This application can fetch comments from YouTube, Reddit, and Facebook. 

**Quick Start:**
- ✅ **Reddit**: Works immediately - no API key needed! (uses public JSON API)
- ✅ **YouTube**: Requires API key (free tier available)
- ⚠️ **Facebook**: Optional - requires access token (app works without it, just won't fetch Facebook comments)

Follow the instructions below to configure API keys for platforms that need them.

## Environment Variables

Create a `.env.local` file in the root of your `app` directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/email_extractor"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# YouTube API
YOUTUBE_API_KEY="your-youtube-api-key"

# Reddit API (OPTIONAL - uses public JSON API by default)
# REDDIT_ACCESS_TOKEN="your-reddit-access-token"  # Not required!

# Facebook API (OPTIONAL - will return empty results if not provided)
FACEBOOK_PAGE_TOKEN="your-facebook-page-access-token"
```

## 1. YouTube API Key

### Steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**:
    - Navigate to "APIs & Services" > "Library"
    - Search for "YouTube Data API v3"
    - Click "Enable"
4. Create credentials:
    - Go to "APIs & Services" > "Credentials"
    - Click "Create Credentials" > "API Key"
    - Copy the generated API key
5. (Optional) Restrict the API key:
    - Click on the API key to edit it
    - Under "API restrictions", select "Restrict key"
    - Choose "YouTube Data API v3"
    - Save

### Rate Limits:

-   Default quota: 10,000 units per day
-   Each API call costs different units (commentThreads.list costs 1 unit)
-   You can request a quota increase if needed

### Documentation:

-   [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
-   [API Explorer](https://developers.google.com/youtube/v3/docs/commentThreads/list)

---

## 2. Reddit API (No Token Required! ✅)

**Good News:** Reddit integration works **without any access token**! The app uses Reddit's public JSON API, which doesn't require authentication.

### How It Works:

-   Simply append `.json` to any Reddit URL to get JSON data
-   Example: `https://www.reddit.com/r/subreddit/comments/postid.json`
-   No authentication needed for public posts and comments
-   Works immediately - just add Reddit URLs!

### Optional: OAuth Token (for advanced features)

If you need access to private subreddits or higher rate limits, you can optionally set up OAuth:

1. Go to [Reddit Apps](https://www.reddit.com/prefs/apps)
2. Click "create another app..." or "create app"
3. Fill in the form:
    - **Name**: Your app name (e.g., "Email Extractor")
    - **Type**: Select "script"
    - **Description**: Brief description of your app
    - **Redirect URI**: `http://localhost:3000` (for development)
    - Click "create app"
4. Get an access token:
    ```bash
    curl -X POST https://www.reddit.com/api/v1/access_token \
      -d "grant_type=client_credentials" \
      -u "YOUR_CLIENT_ID:YOUR_SECRET" \
      -H "User-Agent: YourAppName/1.0 by YourUsername"
    ```

**Note:** The app works fine without this token for public Reddit content!

### Rate Limits:

-   Public API: ~60 requests per minute (reasonable use)
-   With OAuth: Higher limits available

### Documentation:

-   [Reddit API Documentation](https://www.reddit.com/dev/api/)

---

## 3. Facebook Page Access Token (Optional)

**Note:** Facebook integration requires an access token. If no token is provided, the app will gracefully return empty results for Facebook URLs (no errors).

### Steps (if you want Facebook integration):

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app:
    - Click "My Apps" > "Create App"
    - Choose "Business" type
    - Fill in app details
3. Add Facebook Login product:
    - In the app dashboard, click "Add Product"
    - Find "Facebook Login" and click "Set Up"
4. Get a Page Access Token:
    - Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
    - Select your app from the dropdown
    - Click "Generate Access Token"
    - Choose the permissions you need:
        - `pages_read_engagement` (to read comments)
        - `pages_show_list` (to list pages)
    - For a Page Token:
        - Go to your Facebook Page
        - Settings > Page Roles > Access Tokens
        - Generate a token with required permissions
5. Get a Long-Lived Token (recommended):
    - Short-lived tokens expire in 1-2 hours
    - Exchange for long-lived token (60 days):
    ```bash
    curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_TOKEN"
    ```

### Important Notes:

-   **Facebook token is optional** - app will work without it (just won't fetch Facebook comments)
-   Facebook has strict policies about data usage
-   Ensure your app complies with [Facebook Platform Policy](https://developers.facebook.com/policy/)
-   Page tokens are specific to a page - you'll need one per page you want to access
-   For public posts, you may not need all permissions

### Rate Limits:

-   Varies by endpoint and app type
-   Check [Rate Limiting Documentation](https://developers.facebook.com/docs/graph-api/overview/rate-limiting)

### Documentation:

-   [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
-   [Page Access Tokens](https://developers.facebook.com/docs/pages/access-tokens)
-   [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

---

## Security Best Practices

1. **Never commit `.env.local` to version control**

    - Already in `.gitignore`
    - Use environment variables in production

2. **Rotate keys regularly**

    - Especially if exposed or compromised

3. **Use different keys for development and production**

    - Separate apps/projects for each environment

4. **Restrict API keys when possible**

    - Limit to specific IPs, domains, or APIs

5. **Monitor usage**
    - Set up alerts for unusual activity
    - Track API quota usage

---

## Testing Your Setup

After configuring your API keys, test each one:

### YouTube:

```bash
curl "https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=VIDEO_ID&key=YOUR_API_KEY"
```

### Reddit (No token needed):

```bash
curl -H "User-Agent: YourApp/1.0" \
     "https://www.reddit.com/r/test/comments.json"
```

### Facebook:

```bash
curl "https://graph.facebook.com/v18.0/POST_ID/comments?access_token=YOUR_TOKEN"
```

---

## Troubleshooting

### YouTube:

-   **403 Forbidden**: Check API key is correct and YouTube Data API v3 is enabled
-   **Quota exceeded**: Wait for quota reset or request increase

### Reddit:

-   **404 Not Found**: Invalid Reddit URL or post doesn't exist
-   **429 Too Many Requests**: Rate limit exceeded, wait a bit and try again
-   **No comments returned**: Post may have no comments or URL format is incorrect

### Facebook:

-   **Invalid Token**: Token expired, generate a new long-lived token
-   **Insufficient Permissions**: Add required permissions to your token
-   **Access Denied**: Post may be private or page settings restrict access

---

## Production Deployment

For production, set these environment variables in your hosting platform:

-   **Vercel**: Project Settings > Environment Variables
-   **Railway**: Variables tab
-   **Heroku**: Config Vars
-   **AWS/Docker**: Use secrets management service

Ensure `NEXTAUTH_URL` matches your production domain.


