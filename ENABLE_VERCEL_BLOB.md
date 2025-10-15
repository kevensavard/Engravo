# 🆓 Enable Vercel Blob Storage (FREE)

## ✅ Why Vercel Blob?

- ✅ **100% FREE** for your usage (100GB bandwidth, 1GB storage)
- ✅ **No credit card required** for free tier
- ✅ **Global CDN** - Fast image loading worldwide
- ✅ **Simple setup** - Just click a button in Vercel
- ✅ **Auto-managed** - No configuration needed

---

## 🚀 How to Enable (5 Minutes)

### **Step 1: Go to Vercel Dashboard**

1. Go to https://vercel.com/dashboard
2. Click on your **Engravo** project
3. Click **"Storage"** in the top navigation

### **Step 2: Create Blob Store**

1. Click **"Create Database"** or **"Connect Store"**
2. Select **"Blob"** (the orange icon)
3. Click **"Continue"**
4. **Store Name**: `engravo-images` (or any name)
5. Click **"Create"**

### **Step 3: Connect to Project**

1. It will ask which project to connect to
2. Select your **Engravo** project
3. Click **"Connect"**

### **Step 4: Done! ✅**

That's it! Vercel automatically:
- ✅ Creates the `BLOB_READ_WRITE_TOKEN` environment variable
- ✅ Adds it to your project
- ✅ Redeploys your app

---

## 📊 Free Tier Limits

**Vercel Blob Free Tier:**
- **Storage**: 1GB (thousands of images)
- **Bandwidth**: 100GB/month (millions of views)
- **Requests**: Unlimited
- **Cost**: $0

**This is more than enough for:**
- Testing and development
- Small to medium businesses
- Thousands of users

**When you might need to upgrade:**
- If you exceed 100GB bandwidth/month
- If you exceed 1GB storage
- Then it's only **$0.15/GB storage** and **$0.20/GB bandwidth**

---

## ✅ Verification

After enabling Blob storage:

1. **Check Environment Variables:**
   - Vercel Dashboard → Your Project → Settings → Environment Variables
   - You should see: `BLOB_READ_WRITE_TOKEN` (auto-added by Vercel)

2. **Test Upload:**
   - Go to https://engravo.app/dashboard
   - Upload an image
   - Should work without errors!

3. **Check Blob Dashboard:**
   - Vercel → Your Project → Storage → Blob
   - You should see uploaded files appearing

---

## 🎯 What Happens Now

### **When User Uploads Image:**

1. Image sent to `/api/upload`
2. Converted to buffer
3. **Uploaded to Vercel Blob** (cloud storage)
4. Returns a URL like: `https://xxxxx.public.blob.vercel-storage.com/uploads/123-image.png`
5. This URL is used for all subsequent processing

### **When Processing Images:**

1. API loads image from Blob URL
2. Processes it (sharpen, effects, etc.)
3. **Saves result back to Vercel Blob**
4. Returns new Blob URL
5. Frontend displays from Blob URL

### **Benefits:**

- ✅ **Fast** - Global CDN
- ✅ **Reliable** - 99.9% uptime
- ✅ **Free** - No costs for your usage
- ✅ **Automatic** - No manual management

---

## 🔧 Alternative: Vercel KV + Temporary Files

If you don't want to use Blob, here's a quick alternative using `/tmp`:

```typescript
// Use /tmp directory (writable in Vercel)
const UPLOAD_DIR = "/tmp/uploads";

export async function saveBuffer(buffer: Buffer, filename: string): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filepath = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(filepath, buffer);
  return filepath; // Return local path
}
```

**Downsides:**
- ❌ Files deleted after function execution (~45 seconds)
- ❌ Not accessible from other functions
- ❌ Can't show images to users (need to convert to base64)
- ❌ Doesn't work for your use case

**That's why Vercel Blob is the best free solution!**

---

## 📸 How Images are Stored

### **Before (Local Filesystem - Doesn't work on Vercel):**
```
public/uploads/
├── 123-image.png
├── 124-depth-map.png
└── 125-no-bg.png
```

### **After (Vercel Blob - Works everywhere):**
```
Vercel Blob Cloud:
├── uploads/123-image.png → https://xxx.blob.vercel-storage.com/uploads/123-image.png
├── uploads/124-depth-map.png → https://xxx.blob.vercel-storage.com/uploads/124-depth-map.png
└── uploads/125-no-bg.png → https://xxx.blob.vercel-storage.com/uploads/125-no-bg.png
```

---

## 💡 Pro Tips

### **Blob Storage Best Practices:**

1. **Use descriptive filenames:**
   - Include timestamp for uniqueness
   - Include user ID if needed
   - Example: `uploads/user-abc123-1234567890-image.png`

2. **Set up retention policies:**
   - Delete old images after 30 days (save storage)
   - Can be automated with Vercel Cron jobs

3. **Monitor usage:**
   - Check Vercel → Storage → Blob
   - See storage and bandwidth usage

4. **Optimize images before upload:**
   - Already handled by Sharp
   - Reduces storage costs

---

## 🆘 Troubleshooting

### **"Missing Blob token" error**

1. Go to Vercel → Your Project → Storage
2. Make sure Blob store is connected
3. Check environment variables for `BLOB_READ_WRITE_TOKEN`
4. Redeploy if needed

### **"Unauthorized" error**

- Blob token might be wrong
- Disconnect and reconnect Blob store
- Vercel will regenerate the token

### **Images not uploading**

- Check function logs in Vercel
- Verify Blob store is active
- Check if you hit free tier limits (unlikely)

---

## ✅ Quick Setup Checklist

- [ ] Go to Vercel Dashboard
- [ ] Click your Engravo project
- [ ] Click "Storage" tab
- [ ] Create new Blob store
- [ ] Name it (e.g., "engravo-images")
- [ ] Connect to your project
- [ ] Wait for automatic redeploy (~2 min)
- [ ] Test image upload
- [ ] Verify images appear in Blob dashboard

**Total time: ~5 minutes**
**Total cost: $0** 🎉

---

## 🔄 After Setup

Once Blob is enabled:

1. ✅ All image uploads will use Vercel Blob
2. ✅ All processed images stored in Blob
3. ✅ Fast global delivery via CDN
4. ✅ No filesystem errors
5. ✅ Works perfectly on Vercel

**Your app will be fully functional!** 🚀

