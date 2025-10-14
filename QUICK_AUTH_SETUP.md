# 🚀 Quick Start - Authentication Setup

## 📋 Immediate Actions Needed

### 1. Add Clerk Keys to `.env.local`

Open your `.env.local` file and **replace the placeholder values** with your actual Clerk keys:

```env
# Find these at https://dashboard.clerk.com/
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_actual_publishable_key_here
CLERK_SECRET_KEY=your_actual_secret_key_here

# These are already configured correctly:
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 2. Initialize Database

Run this single command to create your database tables:

```bash
npm run db:push
```

### 3. Start the App

```bash
npm run dev
```

## ✅ That's It!

Your app is now ready with:
- ✅ Authentication (Clerk)
- ✅ Database (Neon PostgreSQL)
- ✅ Protected routes
- ✅ User credits system
- ✅ Landing page at `/`
- ✅ Dashboard at `/dashboard`

## 🎯 Test the Flow

1. Visit `http://localhost:3000`
2. Click "Start Free"
3. Sign up with email
4. Get redirected to dashboard
5. Start editing images!

## 📊 View Your Database

```bash
npm run db:studio
```

Opens visual database browser at `https://local.drizzle.studio`

## ⚠️ Optional: Set Up Webhook (for production)

For now, user sync happens on dashboard page load.

For production, set up Clerk webhook:
1. Clerk Dashboard → Webhooks → Add Endpoint
2. URL: `https://your-domain.com/api/webhook/clerk`
3. Events: `user.created`, `user.updated`, `user.deleted`
4. Copy webhook secret → Add to `.env.local` as `CLERK_WEBHOOK_SECRET`

---

**Full setup guide:** See `AUTHENTICATION_SETUP.md`

