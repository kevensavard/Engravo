import { put, del, list } from '@vercel/blob';
import { promises as fs } from 'fs';
import path from 'path';

// Check if we're in production with blob token available
function isBlobAvailable(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

// Local storage fallback functions
async function ensureLocalUploadDir(): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
  return uploadDir;
}

async function uploadToLocal(buffer: Buffer, filename: string): Promise<string> {
  const uploadDir = await ensureLocalUploadDir();
  
  // Handle nested directories in filename (e.g., "uploads/user123/timestamp-file.png")
  const fullPath = path.join(uploadDir, filename);
  const dirPath = path.dirname(fullPath);
  
  // Ensure the directory exists
  await fs.mkdir(dirPath, { recursive: true });
  
  // Write the file
  await fs.writeFile(fullPath, buffer);
  
  // Return the web-accessible path
  return `/uploads/${filename}`;
}

export async function uploadToBlob(buffer: Buffer, filename: string): Promise<string> {
  // Use Vercel Blob in production, local storage in development
  if (isBlobAvailable()) {
    try {
      const blob = await put(filename, buffer, {
        access: 'public',
        addRandomSuffix: false,
      });
      
      return blob.url;
    } catch (error) {
      console.error("Blob upload error:", error);
      throw error;
    }
  } else {
    // Fallback to local storage for development
    console.log("Using local storage fallback for development");
    return await uploadToLocal(buffer, filename);
  }
}

async function deleteFromLocal(url: string): Promise<boolean> {
  try {
    // Extract the relative path from the URL (e.g., "/uploads/user123/timestamp-file.png" -> "uploads/user123/timestamp-file.png")
    const relativePath = url.replace('/uploads/', 'uploads/');
    const filepath = path.join(process.cwd(), 'public', relativePath);
    await fs.unlink(filepath);
    console.log("Deleted from local storage:", relativePath);
    return true;
  } catch (error) {
    console.error("Local delete error:", error);
    return false;
  }
}

export async function deleteFromBlob(url: string): Promise<boolean> {
  if (isBlobAvailable()) {
    try {
      await del(url);
      console.log("Deleted from blob:", url);
      return true;
    } catch (error) {
      console.error("Blob delete error:", error);
      return false;
    }
  } else {
    // Fallback to local storage for development
    return await deleteFromLocal(url);
  }
}

export async function deleteMultipleFromBlob(urls: string[]): Promise<void> {
  if (isBlobAvailable()) {
    try {
      await del(urls);
      console.log(`Deleted ${urls.length} files from blob`);
    } catch (error) {
      console.error("Blob bulk delete error:", error);
    }
  } else {
    // Fallback to local storage for development
    for (const url of urls) {
      await deleteFromLocal(url);
    }
    console.log(`Deleted ${urls.length} files from local storage`);
  }
}

async function listLocalFiles(userId: string): Promise<string[]> {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const files = await fs.readdir(uploadDir);
    const userFiles = files.filter(file => file.startsWith(`${userId}-`));
    return userFiles.map(file => `/uploads/${file}`);
  } catch (error) {
    console.error("Error listing local files:", error);
    return [];
  }
}

export async function listUserBlobs(userId: string): Promise<string[]> {
  if (isBlobAvailable()) {
    try {
      const { blobs } = await list({
        prefix: `uploads/${userId}/`,
      });
      return blobs.map(blob => blob.url);
    } catch (error) {
      console.error("Error listing blobs:", error);
      return [];
    }
  } else {
    // Fallback to local storage for development
    return await listLocalFiles(userId);
  }
}

async function loadImageFromLocal(url: string): Promise<Buffer> {
  try {
    // Extract the relative path from the URL (e.g., "/uploads/user123/timestamp-file.png" -> "uploads/user123/timestamp-file.png")
    const relativePath = url.replace('/uploads/', 'uploads/');
    const filepath = path.join(process.cwd(), 'public', relativePath);
    return await fs.readFile(filepath);
  } catch (error) {
    console.error("Error loading image from local storage:", error);
    throw error;
  }
}

export async function loadImageFromUrl(url: string): Promise<Buffer> {
  try {
    // Check if it's a local URL (starts with /uploads/)
    if (url.startsWith('/uploads/') && !isBlobAvailable()) {
      return await loadImageFromLocal(url);
    }
    
    // Otherwise, fetch from URL (blob or external)
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Error loading image from URL:", error);
    throw error;
  }
}

