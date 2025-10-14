# 🔐 Authentication & Database Setup Guide

This guide will help you set up Clerk authentication and Neon database for Engravo.app.

## ✅ What's Already Done

- ✅ Clerk SDK installed (`@clerk/nextjs`)
- ✅ Drizzle ORM configured with PostgreSQL
- ✅ Middleware protecting `/dashboard` routes
- ✅ Sign-in and sign-up pages created
- ✅ Database schema defined (users, credits, transactions, projects)
- ✅ User sync functions created
- ✅ Webhook handler for Clerk events

## 🔧 Setup Steps

### 1. Configure Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application (or use existing)
3. Copy your API keys

4. **Update your `.env.local` file** with your Clerk keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 2. Set Up Clerk Webhook (for user sync)

1. In Clerk Dashboard, go to **Webhooks**
2. Click **Add Endpoint**
3. Set URL to: `https://your-domain.com/api/webhook/clerk` (or use ngrok for local dev)
4. Subscribe to these events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the **Signing Secret** (starts with `whsec_`)
6. Add to `.env.local`:

```env
CLERK_WEBHOOK_SECRET=whsec_your_secret_here
```

### 3. Database Setup (Already Configured!)

Your Neon database URL is already in the setup:

```env
DATABASE_URL=postgresql://neondb_owner:npg_XN5lRImOag2k@ep-gentle-butterfly-adxhfd8s-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 4. Initialize Database

Run these commands to set up your database tables:

```bash
# Generate migration files
npm run db:generate

# Apply migrations to database
npm run db:push
```

**OR** use the simpler push command for development:

```bash
npm run db:push
```

### 5. Start the App

```bash
npm run dev
```

## 🎯 How It Works

### Protected Routes

- `/` - Landing page (public)
- `/sign-in` - Sign in page (public)
- `/sign-up` - Sign up page (public)
- `/dashboard` - Image editor (protected, requires auth)

### User Flow

1. User visits landing page
2. Clicks "Start Free" → redirected to `/sign-in`
3. Signs up with email/OAuth
4. Clerk creates account
5. User redirected to `/dashboard`
6. Dashboard page syncs user to database
7. User gets 60 free credits (free tier)

### Credits System

All users are tracked in the database with:
- **60 free credits** on signup
- Credits are deducted when using premium features
- All transactions are logged

### Database Schema

**users table:**
- `id` - Clerk user ID
- `email` - User email
- `credits` - Current credit balance
- `subscriptionTier` - free, starter, pro, master, studio
- `subscriptionStatus` - active, cancelled, expired

**credit_transactions table:**
- Logs all credit additions and deductions
- Tracks which features were used

**projects table:**
- Stores user projects and edited images

## 🛠️ Database Management

### View Database in Browser

```bash
npm run db:studio
```

This opens Drizzle Studio at `https://local.drizzle.studio`

### Generate New Migrations

After changing `lib/db/schema.ts`:

```bash
npm run db:generate
npm run db:push
```

## 🎨 Credit Costs (Future Implementation)

| Feature | Credits | 
|---------|---------|
| Basic Tools | Free |
| Effects | Free |
| Depth Map | 10 |
| AI Upscale | 15 |
| Vectorize | 5 |
| Remove BG | 5 |
| Puzzle Generator | 5 |

## 🚀 Next Steps

1. **Add credit checking** to API routes that use premium features
2. **Implement Stripe** for credit purchases and subscriptions
3. **Add user dashboard** to show credit balance and history
4. **Rate limiting** based on subscription tier

## 📝 Files Created

- `middleware.ts` - Route protection
- `app/layout.tsx` - ClerkProvider wrapper
- `app/sign-in/[[...sign-in]]/page.tsx` - Sign in page
- `app/sign-up/[[...sign-up]]/page.tsx` - Sign up page
- `app/dashboard/page.tsx` - Protected dashboard with user sync
- `app/api/webhook/clerk/route.ts` - Webhook handler
- `lib/db/schema.ts` - Database schema
- `lib/db/index.ts` - Database client
- `lib/db/users.ts` - User management functions
- `lib/db/migrate.ts` - Migration script
- `drizzle.config.ts` - Drizzle configuration

## 🔒 Security Notes

- Never commit `.env.local` to git (it's already in `.gitignore`)
- Webhook secret is used to verify requests from Clerk
- Middleware automatically protects all routes except public ones
- Database credentials are encrypted in transit (SSL required)

## 🆘 Troubleshooting

**Database connection fails:**
- Check DATABASE_URL in `.env.local`
- Verify Neon database is active
- Check SSL settings

**Clerk authentication not working:**
- Verify API keys are correct
- Check redirect URLs match your app
- Clear browser cookies

**Webhook not syncing users:**
- Verify webhook secret is correct
- Check webhook URL is accessible (use ngrok for local dev)
- View webhook logs in Clerk Dashboard

---

**Need Help?** Check the [Clerk Docs](https://clerk.com/docs) or [Drizzle Docs](https://orm.drizzle.team/docs/overview)

