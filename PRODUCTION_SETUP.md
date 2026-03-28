# 🚀 Production Deployment Guide - Engravo.app

**Domain:** https://engravo.app

This guide will walk you through setting up Engravo.app for production deployment with live Stripe payments.

---

## 📋 Table of Contents

1. [Environment Variables](#environment-variables)
2. [Stripe Setup (Live Mode)](#stripe-setup-live-mode)
3. [Clerk Setup (Production)](#clerk-setup-production)
4. [Database Setup (Neon)](#database-setup-neon)
5. [Cloudinary Setup](#cloudinary-setup)
6. [Vercel Deployment](#vercel-deployment)
7. [Post-Deployment Checklist](#post-deployment-checklist)

---

## 🔐 Environment Variables

### **Complete List for Production**

Add these to your Vercel project settings:

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://engravo.app

# Clerk Authentication (Production Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_live_YOUR_SECRET_HERE
CLERK_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@YOUR_HOST.aws.neon.tech/neondb?sslmode=require

# Cloudinary (Background Removal)
CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_API_KEY
CLOUDINARY_API_SECRET=YOUR_API_SECRET

# Stripe (Live Mode - IMPORTANT!)
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE



STRIPE_PRICE_STARTER=price_1SIHp3Pv4WSX91ci85OgHwWq
STRIPE_PRICE_PRO=price_1SIHq3Pv4WSX91cifOyHIUyk
STRIPE_PRICE_MASTER=price_1SIHqnPv4WSX91ciNTUldv2L


STRIPE_PRICE_SMALL_PACK=price_1SIHrXPv4WSX91cirzy1cHtu
STRIPE_PRICE_MEDIUM_PACK=price_1SIHsQPv4WSX91ci6FHKlJEs
STRIPE_PRICE_LARGE_PACK=price_1SIHt5Pv4WSX91ciqDGjyI4M
STRIPE_PRICE_MEGA_PACK=price_1SIHtfPv4WSX91ciGNBP6Zmj

# Optional - Upload Configuration
MAX_FILE_SIZE=10485760
MAX_UPLOAD_DIMENSION=4096
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# Optional - Security
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

---

## 💳 Stripe Setup (Live Mode)

### **Step 1: Activate Your Stripe Account**

1. Go to https://dashboard.stripe.com
2. Click on your account name (top left)
3. Click **"Activate your account"**
4. Fill in all required business information:
   - Business details
   - Bank account information (for payouts)
   - Tax information
   - Personal verification documents
5. Wait for Stripe to verify your account (usually 1-2 business days)

### **Step 2: Switch to Live Mode**

1. In Stripe Dashboard, toggle the switch in the top right from **"Test mode"** to **"Live mode"**
2. ⚠️ **IMPORTANT**: Make sure you're in LIVE MODE for all the following steps

### **Step 3: Get Your Live API Keys**

1. Go to **Developers** → **API keys**
2. Make sure you're in **LIVE MODE** (check the toggle)
3. Copy these keys:
   - **Publishable key** (starts with `pk_live_`)
   - **Secret key** (starts with `sk_live_`) - Click "Reveal live key token"
4. Add them to your Vercel environment variables:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
   - `STRIPE_SECRET_KEY=sk_live_...`

### **Step 4: Create Products (Monthly Subscriptions)**

1. Go to **Products** → **Add product**

#### **Product 1: Starter Plan**
- **Name**: `Engravo Starter Plan`
- **Description**: `200 monthly credits for basic image editing`
- **Pricing**: 
  - **Price**: `$9.99`
  - **Billing period**: `Monthly`
  - **Currency**: `USD`
- Click **"Save product"**
- **Copy the Price ID** (starts with `price_`) - you'll need this
- **Metadata** (optional but recommended):
  - Key: `credits`, Value: `200`
  - Key: `tier`, Value: `starter`

#### **Product 2: Pro Plan**
- **Name**: `Engravo Pro Plan`
- **Description**: `500 monthly credits with priority processing`
- **Pricing**: 
  - **Price**: `$24.99`
  - **Billing period**: `Monthly`
  - **Currency**: `USD`
- Click **"Save product"**
- **Copy the Price ID** (starts with `price_`)
- **Metadata**:
  - Key: `credits`, Value: `500`
  - Key: `tier`, Value: `pro`

#### **Product 3: Master Plan**
- **Name**: `Engravo Master Plan`
- **Description**: `1200 monthly credits with fastest processing`
- **Pricing**: 
  - **Price**: `$49.99`
  - **Billing period**: `Monthly`
  - **Currency**: `USD`
- Click **"Save product"**
- **Copy the Price ID** (starts with `price_`)
- **Metadata**:
  - Key: `credits`, Value: `1200`
  - Key: `tier`, Value: `master`

### **Step 5: Create Products (One-Time Credit Packs)**

#### **Credit Pack 1: Small Pack**
- **Name**: `Small Credit Pack`
- **Description**: `100 credits for one-time use`
- **Pricing**: 
  - **Price**: `$5.00`
  - **Billing period**: `One-time`
  - **Currency**: `USD`
- **Metadata**:
  - Key: `credits`, Value: `100`
  - Key: `type`, Value: `one_time`

#### **Credit Pack 2: Medium Pack**
- **Name**: `Medium Credit Pack`
- **Description**: `300 credits + 50 bonus credits`
- **Pricing**: 
  - **Price**: `$15.00`
  - **Billing period**: `One-time`
  - **Currency**: `USD`
- **Metadata**:
  - Key: `credits`, Value: `350`
  - Key: `type`, Value: `one_time`

#### **Credit Pack 3: Large Pack**
- **Name**: `Large Credit Pack`
- **Description**: `600 credits + 150 bonus credits`
- **Pricing**: 
  - **Price**: `$25.00`
  - **Billing period**: `One-time`
  - **Currency**: `USD`
- **Metadata**:
  - Key: `credits`, Value: `750`
  - Key: `type`, Value: `one_time`

#### **Credit Pack 4: Mega Pack**
- **Name**: `Mega Credit Pack`
- **Description**: `1200 credits + 400 bonus credits`
- **Pricing**: 
  - **Price**: `$40.00`
  - **Billing period**: `One-time`
  - **Currency**: `USD`
- **Metadata**:
  - Key: `credits`, Value: `1600`
  - Key: `type`, Value: `one_time`

### **Step 6: Configure Stripe Webhook**

1. Go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://engravo.app/api/webhook/stripe`
4. **Description**: `Engravo.app Payment Webhooks`
5. **Events to send**: Click "Select events" and choose:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Click **"Add endpoint"**
7. **Copy the Signing secret** (starts with `whsec_`)
8. Add it to Vercel: `STRIPE_WEBHOOK_SECRET=whsec_...`

### **Step 7: Configure Payment Settings**

1. Go to **Settings** → **Payment methods**
2. Enable payment methods you want to accept:
   - ✅ Card (Visa, Mastercard, Amex)
   - ✅ Apple Pay
   - ✅ Google Pay
   - ✅ (Optional) Other methods based on your target countries

3. Go to **Settings** → **Customer portal**
4. Click **"Activate test link"** → **"Activate"**
5. This allows customers to manage their subscriptions

### **Step 8: Set Up Tax Collection (Recommended)**

1. Go to **Settings** → **Tax**
2. Click **"Set up tax collection"**
3. Enable **Stripe Tax** (automatically calculates tax based on customer location)
4. Configure your tax settings based on your business location

### **Step 9: Verify Live Mode Configuration**

✅ **Checklist:**
- [ ] Account is fully activated
- [ ] In LIVE MODE (not test mode)
- [ ] Live API keys are copied
- [ ] 3 subscription products created
- [ ] 4 credit pack products created
- [ ] Webhook endpoint created and signing secret copied
- [ ] Payment methods configured
- [ ] Customer portal activated

---

## 🔐 Clerk Setup (Production)

### **Step 1: Create Production Instance**

1. Go to https://dashboard.clerk.com
2. Select your application
3. Switch to **Production** instance (top left dropdown)
4. Or create a new production instance if needed

### **Step 2: Get Production API Keys**

1. In Clerk Dashboard (Production instance), go to **API Keys**
2. Copy the following:
   - **Publishable key** (starts with `pk_live_`)
   - **Secret key** (starts with `sk_live_`)
3. Add to Vercel environment variables

### **Step 3: Configure Production Settings**

1. **Paths** (Settings → Paths):
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/dashboard`
   - After sign-up URL: `/dashboard`

2. **Allowed domains** (Settings → Domains):
   - Add `engravo.app`
   - Add `www.engravo.app`

3. **Social Connections** (optional):
   - Enable Google OAuth
   - Enable GitHub OAuth
   - etc.

### **Step 4: Set Up Production Webhook**

1. Go to **Webhooks** → **Add Endpoint**
2. **Endpoint URL**: `https://engravo.app/api/webhook/clerk`
3. **Subscribe to events**:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Click **"Create"**
5. **Copy the Signing Secret**
6. Add to Vercel: `CLERK_WEBHOOK_SECRET=whsec_...`

---

## 🗄️ Database Setup (Neon)

### **Step 1: Create Production Database**

1. Go to https://console.neon.tech
2. Create a new project or use existing
3. Name it: `Engravo Production`
4. Select region closest to your users

### **Step 2: Get Connection String**

1. Go to your project → **Dashboard**
2. Copy the connection string (starts with `postgresql://`)
3. Make sure it includes `?sslmode=require` at the end
4. Add to Vercel: `DATABASE_URL=postgresql://...`

### **Step 3: Initialize Database Schema**

**Option A: From Local Machine**

```bash
# Set up .env.local with production DATABASE_URL
echo "DATABASE_URL=your_production_connection_string" > .env.local

# Push schema to production database
npm run db:push
```

**Option B: Using Drizzle Studio**

```bash
npm run db:studio
```

### **Step 4: Verify Database**

1. Check that tables are created:
   - `users`
   - `credit_transactions`
2. You can use Neon's SQL Editor or Drizzle Studio to verify

---

## ☁️ Cloudinary Setup

### **Step 1: Get Credentials**

1. Go to https://cloudinary.com/console
2. Copy from Dashboard:
   - **Cloud name**
   - **API Key**
   - **API Secret**
3. Add to Vercel environment variables

### **Step 2: Configure Upload Presets** (Optional)

1. Go to **Settings** → **Upload**
2. Create upload preset for background removal
3. Enable auto-optimization

---

## 🚀 Vercel Deployment

### **Step 1: Deploy to Vercel**

1. Go to https://vercel.com/new
2. Import `kevensavard/Engravo` repository
3. Configure project:
   - **Framework**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### **Step 2: Add All Environment Variables**

Copy all environment variables from the [Environment Variables](#environment-variables) section above.

**IMPORTANT**: Make sure to add them to:
- ✅ Production
- ✅ Preview (optional)
- ⚠️ Development (use test keys for local development)

### **Step 3: Configure Custom Domain**

1. Go to **Settings** → **Domains**
2. Add `engravo.app`
3. Configure DNS:

**At your domain registrar (e.g., GoDaddy, Namecheap):**

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

4. Wait for DNS propagation (up to 48 hours, usually <1 hour)

### **Step 4: Deploy**

1. Click **"Deploy"**
2. Wait for build to complete
3. Verify deployment at `https://engravo.app`

---

## ✅ Post-Deployment Checklist

### **Immediate Verification**

- [ ] Site loads at https://engravo.app
- [ ] SSL certificate is active (🔒 shows in browser)
- [ ] Sign up works and creates user in Clerk
- [ ] User data syncs to Neon database
- [ ] Credits are initialized correctly (50 credits for new users)
- [ ] Image upload works
- [ ] At least one feature works (e.g., sharpen)
- [ ] Credits deduct correctly
- [ ] Background removal works (Cloudinary)
- [ ] Depth map generation works (SculptOK API)

### **Stripe Payment Testing**

**Use Stripe Test Cards in LIVE mode:**

⚠️ **WAIT!** Don't use test cards in live mode! Instead:

1. **Test Checkout Flow**: Create a test subscription
2. **Use a Real Card**: Use your own card for $0.01 test
3. **Immediately Cancel**: Cancel the subscription right after
4. **Refund**: Issue a full refund in Stripe Dashboard

**Or better - Keep Test Mode ON until ready to accept real payments!**

### **Monitor for Issues**

1. **Vercel Logs**:
   - Go to your project → **Deployments** → Latest → **Function Logs**
   - Check for errors

2. **Stripe Logs**:
   - Go to **Developers** → **Logs**
   - Check webhook delivery status

3. **Clerk Logs**:
   - Go to **Logs** in Clerk Dashboard
   - Verify user events

4. **Database**:
   - Check Neon dashboard for connection stats
   - Verify data is being written correctly

### **Security Checklist**

- [ ] All API keys are using LIVE/PRODUCTION versions
- [ ] Webhook secrets are configured correctly
- [ ] HTTPS is enforced (Vercel does this automatically)
- [ ] Environment variables are not exposed in client-side code
- [ ] Rate limiting is configured (optional but recommended)
- [ ] CORS is properly configured for your domain

---

## 🎯 Quick Reference - All Price IDs

After creating products in Stripe, note down all Price IDs here:

```bash
# Monthly Subscriptions
STRIPE_PRICE_STARTER=price_1SIHp3Pv4WSX91ci85OgHwWq
STRIPE_PRICE_PRO=price_1SIHq3Pv4WSX91cifOyHIUyk
STRIPE_PRICE_MASTER=price_1SIHqnPv4WSX91ciNTUldv2L

# One-Time Credit Packs
STRIPE_PRICE_SMALL_PACK=price_1SIHrXPv4WSX91cirzy1cHtu
STRIPE_PRICE_MEDIUM_PACK=price_1SIHsQPv4WSX91ci6FHKlJEs
STRIPE_PRICE_LARGE_PACK=price_1SIHt5Pv4WSX91ciqDGjyI4M
STRIPE_PRICE_MEGA_PACK=price_1SIHtfPv4WSX91ciGNBP6Zmj
```

**Note**: You'll need these Price IDs when implementing the checkout flow in your code.

---

## 🆘 Troubleshooting

### **Deployment Fails**

- Check Vercel build logs for specific errors
- Verify all environment variables are set
- Ensure no syntax errors in code

### **Stripe Webhook Not Receiving Events**

- Verify webhook URL is correct: `https://engravo.app/api/webhook/stripe`
- Check that endpoint is accessible (test with curl)
- Verify webhook secret is correct
- Check Stripe webhook logs for delivery attempts

### **Clerk Webhook Not Working**

- Same as Stripe - verify URL, secret, and accessibility
- Check Clerk webhook logs

### **Database Connection Issues**

- Verify DATABASE_URL is correct
- Check Neon project is not paused (free tier pauses after inactivity)
- Ensure connection string includes `?sslmode=require`

### **Credits Not Deducting**

- Check API route logs in Vercel
- Verify database connection
- Check that user ID from Clerk matches user ID in database

---

## 📞 Support Resources

- **Stripe**: https://support.stripe.com
- **Clerk**: https://clerk.com/support
- **Vercel**: https://vercel.com/support
- **Neon**: https://neon.tech/docs/introduction

---

## 🎉 You're Done!

Your Engravo.app is now live in production with:
- ✅ Custom domain (engravo.app)
- ✅ Live Stripe payments
- ✅ Production authentication (Clerk)
- ✅ Production database (Neon)
- ✅ Cloud image processing (Cloudinary)
- ✅ Credit-based feature system

**Next Steps:**
1. Test the entire user flow yourself
2. Invite beta testers
3. Monitor logs and analytics
4. Set up error tracking (Sentry, LogRocket, etc.)
5. Configure backup strategy for database
6. Set up monitoring/uptime checks

Good luck with your launch! 🚀

