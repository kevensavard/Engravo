# ⚡ Quick Production Checklist - Engravo.app

**Domain:** https://engravo.app

## 🚀 Step-by-Step Launch Guide

### **1️⃣ Vercel - Add Environment Variables**

Go to Vercel Project → Settings → Environment Variables and add:

```bash
# App Config
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://engravo.app

# Clerk (Switch to Production instance first!)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY
CLERK_SECRET_KEY=sk_live_YOUR_KEY
CLERK_WEBHOOK_SECRET=whsec_YOUR_SECRET
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database
DATABASE_URL=postgresql://YOUR_NEON_CONNECTION_STRING?sslmode=require

# Cloudinary
CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_API_KEY
CLOUDINARY_API_SECRET=YOUR_API_SECRET

# Stripe (LIVE MODE!)
STRIPE_SECRET_KEY=sk_live_YOUR_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
```

---

### **2️⃣ Stripe Setup (in LIVE MODE!)**

#### **A. Activate Account**
1. Go to https://dashboard.stripe.com
2. Complete business verification
3. Add bank account info
4. Wait for approval (1-2 days)

#### **B. Switch to LIVE MODE**
- Toggle in top-right corner: **Test mode** → **LIVE MODE** ⚠️

#### **C. Get API Keys**
1. Developers → API keys
2. Copy **Publishable key** (pk_live_...)
3. Reveal and copy **Secret key** (sk_live_...)

#### **D. Create Products**

**Monthly Subscriptions:**

| Product | Price | Credits | Price ID to Copy |
|---------|-------|---------|------------------|
| Starter | $9.99/month | 200 | price_xxxxxx |
| Pro | $24.99/month | 500 | price_xxxxxx |
| Master | $49.99/month | 1200 | price_xxxxxx |

**One-Time Packs:**

| Product | Price | Credits | Price ID to Copy |
|---------|-------|---------|------------------|
| Small | $5 | 100 | price_xxxxxx |
| Medium | $15 | 350 (300+50 bonus) | price_xxxxxx |
| Large | $25 | 750 (600+150 bonus) | price_xxxxxx |
| Mega | $40 | 1600 (1200+400 bonus) | price_xxxxxx |

**Important**: Add metadata to each product:
- `credits`: number of credits
- `tier`: subscription tier name (for subscriptions)
- `type`: "one_time" (for credit packs)

#### **E. Create Webhook**
1. Developers → Webhooks → Add endpoint
2. URL: `https://engravo.app/api/webhook/stripe`
3. Select events:
   - ✅ checkout.session.completed
   - ✅ customer.subscription.created
   - ✅ customer.subscription.updated
   - ✅ customer.subscription.deleted
   - ✅ invoice.payment_succeeded
   - ✅ invoice.payment_failed
4. Copy signing secret (whsec_...)

---

### **3️⃣ Clerk Setup**

#### **A. Switch to Production**
1. Go to https://dashboard.clerk.com
2. Select your app
3. Switch to **Production** instance (dropdown top-left)

#### **B. Get Keys**
1. API Keys section
2. Copy **Publishable key** (pk_live_...)
3. Copy **Secret key** (sk_live_...)

#### **C. Configure Domain**
1. Settings → Domains
2. Add: `engravo.app`
3. Add: `www.engravo.app`

#### **D. Create Webhook**
1. Webhooks → Add Endpoint
2. URL: `https://engravo.app/api/webhook/clerk`
3. Subscribe to:
   - ✅ user.created
   - ✅ user.updated
   - ✅ user.deleted
4. Copy signing secret

---

### **4️⃣ Database Setup**

1. Go to https://console.neon.tech
2. Create/select production project
3. Copy connection string (include `?sslmode=require`)
4. Run locally to push schema:
   ```bash
   echo "DATABASE_URL=your_connection_string" > .env.local
   npm run db:push
   ```

---

### **5️⃣ Cloudinary**

1. Go to https://cloudinary.com/console
2. Copy from dashboard:
   - Cloud name
   - API Key
   - API Secret

---

### **6️⃣ DNS Configuration**

At your domain registrar, add:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

---

### **7️⃣ Deploy**

1. Push to GitHub (already done! ✅)
2. Import to Vercel
3. Add all environment variables
4. Click Deploy
5. Wait ~3-5 minutes

---

### **8️⃣ Verify Everything Works**

✅ **Test Checklist:**

- [ ] Site loads at https://engravo.app
- [ ] Sign up creates account
- [ ] User gets 50 initial credits
- [ ] Upload image works
- [ ] Sharpen feature works & deducts 1 credit
- [ ] Remove background works (Cloudinary)
- [ ] Depth map works (10 credits)
- [ ] Credit count updates in real-time
- [ ] Subscription page loads correctly

---

## 🆘 Common Issues

### **"Clerk keys not found"**
→ Make sure you switched to **Production** instance in Clerk dashboard

### **"Database connection failed"**
→ Verify `?sslmode=require` is at the end of DATABASE_URL

### **"Stripe webhook not receiving events"**
→ Check webhook URL is exactly: `https://engravo.app/api/webhook/stripe`

### **"401 Unauthorized on API calls"**
→ User needs to sign in/up. Check Clerk configuration.

---

## 📝 Save Your Price IDs

After creating Stripe products, save these for future reference:

```
Starter Plan: price_________________
Pro Plan: price_________________
Master Plan: price_________________

Small Pack: price_________________
Medium Pack: price_________________
Large Pack: price_________________
Mega Pack: price_________________
```

---

## 🎉 Launch!

Once everything is verified:

1. ✅ Set Stripe to LIVE mode permanently
2. ✅ Test a real payment (use your own card)
3. ✅ Immediately cancel and refund
4. ✅ Announce launch! 🚀

---

**Need detailed instructions?** → See `PRODUCTION_SETUP.md`

