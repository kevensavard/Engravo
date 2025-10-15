# 🛡️ Admin Dashboard Setup Guide

## ✅ What's Been Created

### **1. Database Schema Update**
- ✅ Added `isAdmin` boolean field to `users` table
- ✅ Defaults to `false` for all users

### **2. Admin Security**
- ✅ Created `lib/admin.ts` with admin checking functions
- ✅ `isAdmin()` - Checks if current user is admin
- ✅ `requireAdmin()` - Throws error if not admin (for API routes)

### **3. API Endpoints**
- ✅ `/api/admin/analytics` - GET analytics data
- ✅ `/api/admin/users` - GET all users (paginated, searchable)
- ✅ `/api/admin/users/[userId]` - GET/PATCH/DELETE specific user

### **4. Admin Dashboard Page**
- ✅ `/admin` - Protected admin-only page
- ✅ Redirects non-admins to `/dashboard`
- ✅ Comprehensive analytics and user management

### **5. Navigation**
- ✅ Admin link appears in nav bar (red with shield icon)
- ✅ Only visible to admin users

---

## 🚀 How to Give Yourself Admin Access

### **Step 1: Update Database Schema**

Run this command locally to add the `isAdmin` column:

```bash
npm run db:push
```

This will add the `isAdmin` column to your production database.

### **Step 2: Make Yourself Admin**

You need to update your user record in the database:

#### **Option A: Using Neon SQL Editor (Easiest)**

1. Go to https://console.neon.tech
2. Select your project
3. Click **"SQL Editor"**
4. Run this query (replace with YOUR email):

```sql
UPDATE users 
SET is_admin = true 
WHERE email = 'kevensavard1992@gmail.com';
```

5. Click **"Run"**
6. You should see "1 row updated"

#### **Option B: Using Drizzle Studio**

```bash
# Locally
npm run db:studio

# Open browser at http://localhost:4983
# Find your user record
# Edit is_admin to true
# Save
```

### **Step 3: Verify Access**

1. Go to https://engravo.app
2. Sign in if not already
3. You should see **"Admin"** link in the navigation bar (red with shield icon)
4. Click it to access `/admin` dashboard

---

## 📊 Admin Dashboard Features

### **Overview Tab**

**Key Metrics Cards:**
- 📊 **Total Users** - All registered users
- 📈 **New Users (30 days)** - Growth tracking
- 💰 **MRR** - Monthly Recurring Revenue from subscriptions
- ⭐ **Total Credits** - All credits distributed to users
- 🔄 **Transactions (30 days)** - Recent activity volume

**Subscription Analytics:**
- Users by tier (Free, Starter, Pro, Master)
- MRR breakdown

**Credit Statistics:**
- Total credits added (purchases + subscriptions)
- Total credits used (features)
- Current distribution

**Feature Usage:**
- Most used features
- Times used
- Total credits spent per feature

**Recent Activity:**
- Last 10 credit transactions
- Real-time activity feed

### **Users Tab**

**User Management:**
- 🔍 **Search** - Search by email, first name, or last name
- 📄 **Pagination** - 20 users per page
- ✏️ **Edit** - Modify user credits and subscription tier
- 🗑️ **Delete** - Remove users (cascade deletes transactions)

**User Table Shows:**
- Profile picture & name
- Email address
- Current credits
- Subscription tier
- Subscription status
- Admin badge (if admin)
- Quick actions

**Edit User Modal:**
- Adjust credits (add or remove)
- Change subscription tier
- Shows difference calculation
- Records transaction in database

---

## 🔒 Security Features

### **Route Protection**
- `/admin` page checks `isAdmin` before rendering
- Redirects non-admins to `/dashboard`
- Server-side check (can't be bypassed)

### **API Protection**
- All `/api/admin/*` endpoints use `requireAdmin()`
- Returns 403 Forbidden if not admin
- Checks database on every request

### **Navigation**
- Admin link only shows if `isAdmin === true`
- Fetched from database, not spoofable

---

## 📈 Analytics Explained

### **MRR (Monthly Recurring Revenue)**

Calculated as:
```
MRR = (Starter count × $9.99) + (Pro count × $24.99) + (Master count × $49.99)
```

This shows your **guaranteed monthly income** from subscriptions.

### **Credit Economics**

- **Total Added**: All credits purchased or given (subscriptions + packs + bonuses)
- **Total Used**: All credits spent on features
- **Distributed**: Current credits users have (can use for analytics)

### **Feature Usage**

Shows which features are most popular:
- Helps you prioritize development
- Shows revenue per feature (credits × usage)
- Identifies underused features

---

## 🎯 Common Admin Tasks

### **Add Credits to a User**

1. Go to Admin → Users tab
2. Search for the user
3. Click Edit button
4. Increase credits value
5. Save

A transaction will be auto-created: "Admin adjustment: +X credits"

### **Upgrade a User's Plan**

1. Find user in Users tab
2. Click Edit
3. Change tier dropdown (free → starter → pro → master)
4. Save

**Note**: This only changes the database tier. It doesn't create a Stripe subscription. For real subscriptions, users should go through Stripe checkout.

### **Make Another User Admin**

1. Go to Neon SQL Editor
2. Run:
```sql
UPDATE users 
SET is_admin = true 
WHERE email = 'user@example.com';
```

### **View User Transaction History**

This isn't in the UI yet, but you can check via SQL:

```sql
SELECT * FROM credit_transactions 
WHERE user_id = 'user_xxx' 
ORDER BY created_at DESC;
```

---

## 🆘 Troubleshooting

### **"Unauthorized: Admin access required"**

- Make sure you ran `npm run db:push` to add the `isAdmin` column
- Verify your user has `is_admin = true` in the database
- Check you're signed in with the correct account

### **Admin link doesn't appear**

- Refresh the page (state needs to load)
- Check browser console for fetch errors
- Verify `/api/user/profile` returns `isAdmin: true`

### **Analytics show 0 for everything**

- Normal if you just deployed
- Need real users and transactions to populate
- Test by:
  - Creating test users
  - Using features (generates transactions)
  - Purchasing credits

### **Can't edit users**

- Check Vercel function logs
- Verify database connection
- Make sure `isAdmin = true` in database

---

## 🎨 Future Enhancements (Optional)

You can add these later if needed:

- **Charts & Graphs** - Visualize MRR growth, user growth
- **Email Users** - Send bulk emails or notifications
- **Feature Toggles** - Enable/disable features for users
- **Refund Credits** - Process refunds
- **Export Data** - Download user list, transactions as CSV
- **Impersonate User** - Sign in as any user for debugging
- **Activity Log** - Track all admin actions
- **Revenue Analytics** - Lifetime value, churn rate, etc.

---

## 📝 SQL Queries for Common Tasks

### **See all admins:**
```sql
SELECT email, first_name, last_name 
FROM users 
WHERE is_admin = true;
```

### **Top credit users:**
```sql
SELECT email, credits, subscription_tier 
FROM users 
ORDER BY credits DESC 
LIMIT 10;
```

### **Revenue by month:**
```sql
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as transactions,
  SUM(amount) as total_credits
FROM credit_transactions 
WHERE type = 'purchase'
GROUP BY month 
ORDER BY month DESC;
```

### **Most active users:**
```sql
SELECT 
  users.email,
  COUNT(credit_transactions.id) as transaction_count,
  SUM(ABS(credit_transactions.amount)) as credits_used
FROM users
LEFT JOIN credit_transactions ON users.id = credit_transactions.user_id
WHERE credit_transactions.type = 'feature_use'
GROUP BY users.email
ORDER BY credits_used DESC
LIMIT 10;
```

---

## ✅ Deployment Checklist

After pushing to GitHub, Vercel will redeploy:

- [ ] Wait for Vercel deployment to complete
- [ ] Run `npm run db:push` locally to add `isAdmin` column
- [ ] Update your user in Neon to set `is_admin = true`
- [ ] Visit https://engravo.app
- [ ] Check if "Admin" link appears in nav bar
- [ ] Click Admin → Should see dashboard with analytics
- [ ] Test editing a user (change credits)
- [ ] Verify changes persist in database

---

## 🎉 You're Done!

Your admin dashboard is now ready with:

- ✅ **Secure access** - Only admins can see/use it
- ✅ **Real-time analytics** - MRR, users, transactions
- ✅ **User management** - Edit credits, tiers, view details
- ✅ **Feature insights** - Most used features and credit spend
- ✅ **Activity monitoring** - Recent transactions
- ✅ **Beautiful UI** - Dark theme matching your app

**Access it at:** https://engravo.app/admin

---

## 🔐 Security Reminders

⚠️ **Important:**
- Only give admin access to trusted people
- Admin can modify any user's credits
- Admin can see all user data
- Admin actions are logged in transactions table
- Consider adding 2FA for admin accounts in Clerk

**Keep your admin credentials secure!** 🛡️

