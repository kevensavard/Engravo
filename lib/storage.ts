import { put, del, list } from '@vercel/blob';

export async function uploadToBlob(buffer: Buffer, filename: string): Promise<string> {
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
}

export async function deleteFromBlob(url: string): Promise<boolean> {
  try {
    await del(url);
    console.log("Deleted from blob:", url);
    return true;
  } catch (error) {
    console.error("Blob delete error:", error);
    return false;
  }
}

export async function deleteMultipleFromBlob(urls: string[]): Promise<void> {
  try {
    await del(urls);
    console.log(`Deleted ${urls.length} files from blob`);
  } catch (error) {
    console.error("Blob bulk delete error:", error);
  }
}

export async function listUserBlobs(userId: string): Promise<string[]> {
  try {
    const { blobs } = await list({
      prefix: `uploads/${userId}/`,
    });
    return blobs.map(blob => blob.url);
  } catch (error) {
    console.error("Error listing blobs:", error);
    return [];
  }
}

export async function loadImageFromUrl(url: string): Promise<Buffer> {
  try {
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

