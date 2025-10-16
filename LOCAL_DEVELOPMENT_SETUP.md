# 🛠️ Local Development Setup

## 🚀 **AUTOMATIC STORAGE FALLBACK**

The app now **automatically detects** whether you're in production or development and uses the appropriate storage method:

### **Production (Vercel Deployed)**
- ✅ **Uses Vercel Blob Storage** (when `BLOB_READ_WRITE_TOKEN` is set)
- ✅ **Cloud storage** - files stored in Vercel's CDN
- ✅ **Automatic cleanup** - old files deleted automatically
- ✅ **Scalable** - handles any number of users

### **Local Development**
- ✅ **Uses Local File Storage** (when `BLOB_READ_WRITE_TOKEN` is NOT set)
- ✅ **Files stored in** `public/uploads/` directory
- ✅ **No setup required** - works immediately
- ✅ **Perfect for testing** - no external dependencies

---

## 🔧 **HOW IT WORKS**

### **Automatic Detection**
```typescript
function isBlobAvailable(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}
```

### **Smart Fallback**
- **If blob token exists** → Use Vercel Blob Storage
- **If no blob token** → Use local file storage
- **Seamless switching** → Same API, different backend

---

## 📁 **LOCAL FILE STRUCTURE**

When developing locally, files are stored in:
```
your-project/
├── public/
│   └── uploads/
│       ├── user_123/
│       │   ├── 1234567890-image.png
│       │   └── 1234567891-vectorized.svg
│       ├── user_456/
│       │   ├── 1234567892-logo.jpg
│       │   └── 1234567893-sketch.png
│       └── ...
```

### **File Naming Convention**
- **Directory Structure**: `uploads/{userId}/{timestamp}-{filename}`
- **Example**: `uploads/user_123/1734567890-logo.png`
- **Purpose**: User-specific organization with automatic directory creation

---

## 🧪 **TESTING LOCALLY**

### **What Works:**
- ✅ **Image uploads** → Stored in `public/uploads/`
- ✅ **All image processing** → Works with local files
- ✅ **Vectorization** → Custom algorithms work locally
- ✅ **File cleanup** → Old files deleted automatically
- ✅ **User sessions** → Each user gets their own files

### **What You Need:**
- ❌ **No API keys required**
- ❌ **No external services**
- ❌ **No blob token setup**
- ✅ **Just run `npm run dev`**

---

## 🚀 **DEPLOYMENT**

### **Production Deployment:**
1. **Set up Vercel Blob** in your Vercel project settings
2. **Add `BLOB_READ_WRITE_TOKEN`** to environment variables
3. **Deploy** → Automatically switches to blob storage
4. **No code changes needed** → Same codebase works everywhere

### **Environment Variables:**
```bash
# Production (Vercel)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_XXXXXXXXXXXX

# Development (Local)
# No BLOB_READ_WRITE_TOKEN needed - uses local storage automatically
```

---

## 🔄 **STORAGE FUNCTIONS**

All storage functions automatically handle both modes:

### **Upload**
```typescript
// Works in both local and production
const url = await uploadToBlob(buffer, filename);
```

### **Delete**
```typescript
// Works in both local and production
await deleteFromBlob(url);
```

### **List Files**
```typescript
// Works in both local and production
const files = await listUserBlobs(userId);
```

### **Load Images**
```typescript
// Works in both local and production
const buffer = await loadImageFromUrl(url);
```

---

## 🐛 **TROUBLESHOOTING**

### **Local Development Issues:**

#### **"No such file or directory"**
- **Solution**: The `public/uploads/` directory is created automatically
- **Check**: Make sure you have write permissions in the project directory

#### **Files not showing in browser**
- **Solution**: Make sure Next.js is serving static files from `public/`
- **Check**: Visit `http://localhost:3000/uploads/` to see files

#### **Cleanup not working**
- **Solution**: Local cleanup uses file system operations
- **Check**: Files are deleted when user uploads new image

### **Production Issues:**

#### **"No token found"**
- **Solution**: Set `BLOB_READ_WRITE_TOKEN` in Vercel environment
- **Check**: Enable Vercel Blob in project settings

#### **Files not accessible**
- **Solution**: Check blob URL format and permissions
- **Check**: Verify blob storage is enabled in Vercel

---

## 💡 **BENEFITS**

### **For Development:**
- ✅ **Zero setup** - works immediately
- ✅ **Fast testing** - no network calls
- ✅ **Easy debugging** - files visible in file system
- ✅ **No costs** - completely free to develop

### **For Production:**
- ✅ **Scalable storage** - handles unlimited users
- ✅ **Global CDN** - fast file delivery worldwide
- ✅ **Automatic cleanup** - no manual maintenance
- ✅ **Reliable** - enterprise-grade infrastructure

---

## 🎯 **SUMMARY**

**The app now works seamlessly in both environments:**

1. **Local Development** → Local file storage (no setup needed)
2. **Production Deployment** → Vercel Blob storage (automatic)

**You can test everything locally without any external dependencies, and when you deploy to production, it automatically switches to the cloud storage system!** 🚀
