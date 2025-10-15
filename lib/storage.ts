import { put } from '@vercel/blob';

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

