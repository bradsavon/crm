# Deployment Guide - Vercel

This guide explains how to deploy the CRM Next.js application to Vercel's free tier.

## Can This Be Deployed to Vercel for Free?

**Yes!** This application can be deployed to Vercel's free Hobby plan, but there are a few considerations:

### ✅ What Works on Vercel Free Tier

- **Next.js Application**: Fully supported
- **API Routes**: Serverless functions included
- **MongoDB**: Use MongoDB Atlas free tier (M0 cluster)
- **Environment Variables**: Free to configure
- **Custom Domains**: One free custom domain
- **SSL/HTTPS**: Automatic SSL certificates

### ⚠️ What Needs Changes

1. **File Storage**: Currently uses local file system (`public/uploads/`), which won't work on serverless functions. You'll need to use cloud storage:
   - **Vercel Blob Storage** (recommended, has free tier)
   - **AWS S3** (free tier available)
   - **Cloudinary** (free tier available)
   - **Supabase Storage** (free tier available)

2. **Build Time**: Free tier has 45 minutes build time limit per month
3. **Function Execution**: 100GB-hours per month (usually sufficient for small apps)
4. **Bandwidth**: 100GB per month

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free)
2. **MongoDB Atlas Account**: Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) (free M0 cluster)
3. **GitHub Account**: For connecting your repository

## Step-by-Step Deployment

### 1. Prepare MongoDB Atlas

1. Create a MongoDB Atlas account
2. Create a free M0 cluster
3. Create a database user
4. Whitelist IP addresses (or use `0.0.0.0/0` for development)
5. Get your connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/crm-nextjs?retryWrites=true&w=majority`)

### 2. Set Up File Storage (Required Before Deployment)

You need to migrate from local file storage to cloud storage. Here are the options:

#### Option A: Vercel Blob Storage (Recommended)

1. Install Vercel Blob:
   ```bash
   npm install @vercel/blob
   ```

2. Get your Blob store token from Vercel dashboard

3. Update `app/api/documents/upload/route.ts` to use Vercel Blob instead of local file system

#### Option B: AWS S3

1. Create an AWS S3 bucket
2. Install AWS SDK:
   ```bash
   npm install @aws-sdk/client-s3
   ```
3. Update upload route to use S3

#### Option C: Cloudinary

1. Create a Cloudinary account
2. Install Cloudinary:
   ```bash
   npm install cloudinary
   ```
3. Update upload route to use Cloudinary

### 3. Deploy to Vercel

#### Method 1: Via Vercel Dashboard (Easiest)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

4. Add Environment Variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A random secret string (generate with `openssl rand -base64 32`)
   - `BLOB_READ_WRITE_TOKEN`: If using Vercel Blob (get from Vercel dashboard)

5. Click "Deploy"

#### Method 2: Via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow prompts and add environment variables when asked

### 4. Post-Deployment Setup

1. **Create Admin User**: After deployment, you'll need to create the first admin user. You can:
   - Use MongoDB Atlas web interface to manually create a user
   - Or create a one-time API endpoint to seed the admin user
   - Or use the `scripts/create-admin.js` script locally and connect to your Atlas database

2. **Verify Environment Variables**: Check that all environment variables are set correctly in Vercel dashboard

3. **Test the Application**: Visit your deployed URL and test:
   - Login functionality
   - Creating contacts/companies/cases
   - File uploads (if configured)
   - All major features

## Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/crm-nextjs` |
| `JWT_SECRET` | Secret for JWT token signing | Random string (use `openssl rand -base64 32`) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token (if using) | Get from Vercel dashboard |
| `NODE_ENV` | Environment | `production` |

## File Storage Migration Guide

### Current Implementation (Local Storage)

The current code saves files to `public/uploads/` directory:

```typescript
// app/api/documents/upload/route.ts
const uploadsDir = join(process.cwd(), 'public', 'uploads');
await writeFile(filepath, buffer);
```

### Migration to Vercel Blob

1. **Install dependency**:
   ```bash
   npm install @vercel/blob
   ```

2. **Update upload route** (`app/api/documents/upload/route.ts`):
   ```typescript
   import { put } from '@vercel/blob';
   
   // Replace file saving logic with:
   const blob = await put(filename, file, {
     access: 'public',
     token: process.env.BLOB_READ_WRITE_TOKEN,
   });
   
   // Update document path to use blob URL
   const document = await Document.create({
     // ... other fields
     path: blob.url, // Instead of `/uploads/${filename}`
   });
   ```

3. **Update document serving** (`app/api/documents/[id]/route.ts`):
   - If using Vercel Blob, files are served via public URLs, so you may not need a separate download endpoint
   - Or use `get()` from `@vercel/blob` to fetch files

4. **Update DocumentPreview component** if needed to handle blob URLs

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Check for TypeScript errors: `npm run build` locally first

### Database Connection Issues

- Verify `MONGODB_URI` is set correctly
- Check MongoDB Atlas IP whitelist includes Vercel IPs (or use `0.0.0.0/0`)
- Verify database user has correct permissions

### File Uploads Not Working

- Ensure file storage is migrated to cloud storage
- Check environment variables for storage service
- Verify file size limits (Vercel has limits on serverless functions)

### Authentication Issues

- Verify `JWT_SECRET` is set
- Check cookie settings (may need to adjust for production domain)
- Ensure HTTPS is enabled (automatic on Vercel)

## Vercel Free Tier Limits

- **Builds**: 100 builds per month
- **Build Time**: 45 minutes total per month
- **Bandwidth**: 100GB per month
- **Function Execution**: 100GB-hours per month
- **Serverless Function Execution**: 10 seconds timeout (Hobby plan)
- **Edge Function Execution**: 25ms CPU time, 30 seconds total

## Upgrading (If Needed)

If you exceed free tier limits, consider:
- **Pro Plan** ($20/month): More builds, longer timeouts, better performance
- **Enterprise Plan**: For large teams

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [MongoDB Atlas Free Tier](https://www.mongodb.com/cloud/atlas/pricing)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)

## Next Steps After Deployment

1. Set up custom domain (optional, free on Vercel)
2. Configure analytics (optional)
3. Set up monitoring and error tracking
4. Configure CI/CD for automatic deployments
5. Set up staging environment for testing

---

*Last updated: [Current Date]*

