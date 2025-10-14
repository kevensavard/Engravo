# Deployment Guide for Vercel

This guide will help you deploy Engravo.app to Vercel.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. A [Clerk](https://clerk.com) account for authentication
3. A [Neon](https://neon.tech) PostgreSQL database
4. A [Cloudinary](https://cloudinary.com) account for background removal
5. Git repository connected to Vercel

## Environment Variables

You need to set up the following environment variables in your Vercel project settings:

### Required Variables

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:password@host.aws.neon.tech/neondb?sslmode=require

# Cloudinary (for Background Removal)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
```

### Optional Variables

```bash
# Upload Configuration
MAX_FILE_SIZE=10485760
MAX_UPLOAD_DIMENSION=4096
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# Processing
ENABLE_ML_FEATURES=false
MODEL_PATH=./models
ENABLE_JOB_QUEUE=false

# Security
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

## Deployment Steps

### 1. Prepare Your Repository

1. Ensure all changes are committed to Git
2. Push to your GitHub/GitLab/Bitbucket repository

### 2. Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your Git repository
4. Select the repository containing your code

### 3. Configure Project Settings

1. **Framework Preset**: Next.js (should be auto-detected)
2. **Root Directory**: `./` (default)
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `.next` (default)

### 4. Add Environment Variables

1. In the Vercel project settings, go to "Environment Variables"
2. Add all the required environment variables listed above
3. Make sure to add them for **Production**, **Preview**, and **Development** environments

### 5. Deploy

1. Click "Deploy"
2. Vercel will build and deploy your application
3. The build process will ignore ESLint and TypeScript errors (configured in `next.config.ts`)

### 6. Set Up Clerk Webhook

After deployment, you need to configure the Clerk webhook:

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to "Webhooks"
3. Click "Add Endpoint"
4. Enter your webhook URL: `https://your-domain.vercel.app/api/webhook/clerk`
5. Subscribe to these events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
6. Copy the webhook secret and add it to your Vercel environment variables as `CLERK_WEBHOOK_SECRET`

### 7. Initialize Database

After first deployment, you need to push the database schema:

```bash
# Clone your repo locally
git clone your-repo-url
cd your-project

# Install dependencies
npm install

# Create .env.local with your production DATABASE_URL
echo "DATABASE_URL=your_neon_database_url" > .env.local

# Push database schema
npm run db:push
```

Alternatively, you can use Drizzle Studio to manage your database:

```bash
npm run db:studio
```

## Post-Deployment

### Verify Deployment

1. Visit your deployed URL
2. Test user registration and login
3. Upload an image and test features
4. Check that credits are being deducted properly

### Monitor Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. View "Function Logs" to monitor API calls and errors

### Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Configure DNS as instructed by Vercel
4. Update `NEXT_PUBLIC_APP_URL` environment variable to your custom domain

## Troubleshooting

### Build Fails

- Check the build logs in Vercel dashboard
- Ensure all environment variables are set correctly
- Verify that `next.config.ts` has `ignoreDuringBuilds: true`

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Ensure Neon database allows connections from Vercel
- Check if database schema is pushed correctly

### Authentication Issues

- Verify all Clerk environment variables are set
- Check webhook URL is correct and accessible
- Ensure webhook secret matches

### Image Processing Issues

- Check Cloudinary credentials are correct
- Verify file upload size limits
- Check Vercel function timeout limits (default 10s, max 60s on Pro plan)

## Performance Optimization

### Caching

Vercel automatically caches static assets. For images:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    domains: ['your-domain.vercel.app'],
    minimumCacheTTL: 60,
  },
};
```

### Function Limits

Be aware of Vercel's serverless function limits:
- **Free Plan**: 10s timeout, 1024MB memory
- **Pro Plan**: 60s timeout, 3008MB memory

For long-running operations (like depth map generation), consider:
1. Using Vercel Pro plan
2. Implementing background jobs with webhooks
3. Using edge functions for faster response

## Continuous Deployment

Vercel automatically deploys:
- **Production**: When you push to your main/master branch
- **Preview**: When you create a pull request

To disable automatic deployments:
1. Go to Settings → Git
2. Configure deployment branches

## Support

For issues:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Neon Documentation](https://neon.tech/docs)

