# Clerk Webhook Setup

To automatically create users in Convex when they sign up with Clerk, you need to set up a webhook.

## Local Development Setup (Using ngrok or similar)

1. **Install ngrok** (if you don't have it):
   ```bash
   brew install ngrok
   # or
   npm install -g ngrok
   ```

2. **Start your dev server**:
   ```bash
   pnpm dev
   ```

3. **In a new terminal, start ngrok**:
   ```bash
   ngrok http 3000
   ```

4. **Copy the ngrok HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Go to Clerk Dashboard**:
   - Visit https://dashboard.clerk.com
   - Select your application
   - Go to "Webhooks" in the sidebar
   - Click "Add Endpoint"

6. **Configure the webhook**:
   - Endpoint URL: `https://YOUR_NGROK_URL/api/clerk-webhook`
   - Subscribe to events: Check `user.created`
   - Click "Create"

7. **Copy the Signing Secret**:
   - After creating, click on the webhook
   - Copy the "Signing Secret"
   - Add to your `.env.local`:
     ```
     CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
     ```

8. **Restart your dev server** to load the new environment variable

## Production Setup (Vercel)

1. **Deploy to Vercel**:
   ```bash
   vercel deploy
   ```

2. **Get your production URL** (e.g., `https://lexikey.vercel.app`)

3. **In Clerk Dashboard**:
   - Add another webhook endpoint
   - URL: `https://your-domain.vercel.app/api/clerk-webhook`
   - Subscribe to: `user.created`
   - Copy the signing secret

4. **Add to Vercel Environment Variables**:
   - Go to your Vercel project settings
   - Environment Variables
   - Add: `CLERK_WEBHOOK_SECRET` with the production signing secret

5. **Redeploy** to apply the environment variable

## Testing

1. Sign up for a new account in your app
2. Check the Clerk webhook logs to see if it was triggered
3. Check your Convex dashboard to see if the user was created
4. Check your console logs for success messages

## Fallback

Even without webhooks, the app will work because we have fallback user creation in:
- `/hooks/useSyncPlacementData.ts` - Creates user when syncing placement data
- `/app/practice/page.tsx` - Creates user when accessing practice page

The webhook is just for better UX (immediate user creation).
