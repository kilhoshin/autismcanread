# Production Deployment Checklist

## Environment Variables (Critical!)

Your production deployment needs these environment variables configured in Vercel:

### Required Environment Variables:
1. **NEXT_PUBLIC_SUPABASE_URL** - Your Supabase project URL
2. **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Your Supabase anon public key
3. **SUPABASE_SERVICE_ROLE_KEY** - Your Supabase service role key (CRITICAL for RLS bypass)
4. **STRIPE_SECRET_KEY** - Your Stripe secret key
5. **STRIPE_WEBHOOK_SECRET** - Your Stripe webhook endpoint secret
6. **NEXT_PUBLIC_APP_URL** - Your production domain URL
7. **GOOGLE_AI_API_KEY** - Your Google AI API key

### How to Set Environment Variables in Vercel:
1. Go to your Vercel project dashboard
2. Go to Settings → Environment Variables
3. Add each variable above with the correct values
4. Redeploy after adding variables

## Supabase Configuration

### 1. Database Row Level Security (RLS)
Ensure your `users` table has proper RLS policies:

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Policy for service role to bypass RLS (for API operations)
CREATE POLICY "Service role can manage all users" ON users
  FOR ALL USING (auth.role() = 'service_role');
```

### 2. Auth Settings
In Supabase Dashboard → Authentication → Settings:
- Set Site URL to your production domain
- Add your production domain to "Redirect URLs"
- Configure email templates with your production domain

## Stripe Configuration

### 1. Webhook Endpoint
In Stripe Dashboard:
1. Go to Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe-webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET` env var

### 2. Price IDs
Make sure your pricing page uses the correct Stripe Price IDs for production.

## Common Production Issues & Solutions

### Issue 1: Users can't login / No user records created
**Solution:** 
- ✅ Already fixed in latest code - AuthContext now automatically creates user records
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in production
- Check Vercel function logs for errors

### Issue 2: Subscription status not updating after payment
**Solution:**
- ✅ Already fixed - APIs now use Service Role client
- Verify webhook endpoint is correctly configured in Stripe
- Check Vercel function logs for webhook processing errors

### Issue 3: PDF generation fails
**Solution:**
- Ensure all required environment variables are set
- Check if Puppeteer works in Vercel environment
- Consider using alternative PDF generation if needed

## Testing Your Production Deployment

1. **Test User Registration/Login:**
   - Create new account
   - Verify user record is created in database
   - Check subscription status shows as 'free'

2. **Test Subscription Flow:**
   - Go to pricing page
   - Complete Stripe checkout
   - Verify subscription status updates to 'premium'

3. **Test Worksheet Generation:**
   - Try generating worksheet preview
   - For premium users, test PDF download

## Debug URLs (Add these to your production app)

Consider adding an admin page at `/admin` for debugging:
- Shows current user info
- Shows subscription status
- Allows manual subscription updates
- Shows debug information

## Vercel Function Logs

To debug production issues:
1. Go to Vercel Dashboard → Functions
2. Check logs for your API routes:
   - `/api/stripe-webhook`
   - `/api/create-user-safe`
   - `/api/update-subscription`
   - `/api/debug-user`

## Quick Fix Commands

If you need to manually fix user records:

```bash
# Check if user exists in database
curl "https://yourdomain.com/api/debug-user?userId=USER_ID_HERE"

# Create missing user record
curl -X POST "https://yourdomain.com/api/create-user-safe" \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID", "email": "user@example.com"}'

# Update subscription status
curl -X POST "https://yourdomain.com/api/update-subscription" \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID", "subscriptionStatus": "premium"}'
```

## Next Steps

1. ✅ Code fixes are already deployed
2. Check Vercel environment variables
3. Configure Supabase Auth URLs
4. Configure Stripe webhook
5. Test the full flow
6. Monitor Vercel function logs for any remaining issues

## Status
- ✅ User record creation: Fixed in AuthContext
- ✅ Subscription updates: Fixed with Service Role client
- ✅ RLS bypass: Implemented in all APIs
- 🔄 Production configuration: Needs verification
