import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import FormData from "form-data";
import axios from "axios";
import { deductCredits } from "@/lib/db/users";

const SCULPTOK_API_KEY = "241a19123be54c60ac7a7251fafb588f";
const SCULPTOK_BASE_URL = "https://api.sculptok.com/api-open";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, feature } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
    }

    // Get current user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Deduct credits
    const creditCost = 10; // Depth map costs 10 credits
    const creditDeducted = await deductCredits(user.id, creditCost, "depthMap", "Applied depth map generation");
    
    if (!creditDeducted) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    console.log("Depth map processing via SculptOK API for:", imageUrl);
    
    // Step 1: Download image from URL (Vercel Blob)
    const cleanUrl = imageUrl.split('?')[0];
    const imageResponse = await axios.get(cleanUrl, {
      responseType: 'arraybuffer'
    });
    const imageBuffer = Buffer.from(imageResponse.data);
    const filename = `image-${Date.now()}.png`;
    
    // Step 2: Upload image to SculptOK
    console.log("Uploading image to SculptOK...");
    const formData = new FormData();
    formData.append("file", imageBuffer, filename);
    
    const uploadResponse = await axios.post(
      `${SCULPTOK_BASE_URL}/image/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "apikey": SCULPTOK_API_KEY,
        },
      }
    );

    if (uploadResponse.data.code !== 0) {
      throw new Error(`Upload failed: ${uploadResponse.data.msg}`);
    }

    const uploadedImageUrl = uploadResponse.data.data.src;
    console.log("Image uploaded successfully:", uploadedImageUrl);

    // Step 3: Submit drawing task
    console.log("Submitting drawing task...");
    const drawResponse = await axios.post(
      `${SCULPTOK_BASE_URL}/draw/prompt`,
      {
        imageUrl: uploadedImageUrl,
        style: "normal", // Can be: normal, portrait, sketch, pro
        hd_fix: "manual", // manual = no AI optimization
        optimal_size: "true",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "apikey": SCULPTOK_API_KEY,
        },
      }
    );

    if (drawResponse.data.code !== 0) {
      throw new Error(`Draw submission failed: ${drawResponse.data.msg}`);
    }

    const promptId = drawResponse.data.data.promptId;
    console.log("Drawing task submitted, promptId:", promptId);

    // Step 4: Poll for completion
    console.log("Polling for completion...");
    let attempts = 0;
    const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max
    let imgRecords: string[] = [];

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await axios.get(
        `${SCULPTOK_BASE_URL}/draw/prompt`,
        {
          params: { uuid: promptId },
          headers: {
            "Content-Type": "application/json",
            "apikey": SCULPTOK_API_KEY,
          },
        }
      );

      if (statusResponse.data.code !== 0) {
        throw new Error(`Status check failed: ${statusResponse.data.msg}`);
      }

      const status = statusResponse.data.data.status;
      const currentStep = statusResponse.data.data.currentStep;
      imgRecords = statusResponse.data.data.imgRecords || [];

      console.log(`Status: ${status}, Step: ${currentStep}, Images: ${imgRecords.length}`);

      // status: 2 = completed, imgRecords should have 3 images
      if (status === 2 && imgRecords.length === 3) {
        console.log("Depth map generation completed!");
        break;
      }

      attempts++;
    }

    if (imgRecords.length !== 3) {
      throw new Error("Depth map generation timed out or failed");
    }

    // Step 5: Use the first variant as the default display
    // SculptOK returns 3 variants - we'll use the first one
    const selectedImageUrl = imgRecords[0];
    console.log("Using first depth map variant:", selectedImageUrl);

    // Step 6: Download the selected depth map
    const depthMapResponse = await axios.get(selectedImageUrl, {
      responseType: "arraybuffer",
    });

    // Step 7: Upload to Vercel Blob
    const timestamp = Date.now();
    const outputFilename = `${timestamp}-depth-map.png`;
    const depthMapBuffer = Buffer.from(depthMapResponse.data);
    
    const { uploadToBlob } = await import("@/lib/storage");
    const blobUrl = await uploadToBlob(depthMapBuffer, `uploads/${outputFilename}`);
    console.log("Depth map uploaded to Blob:", blobUrl);

    // Step 8: Get remaining credits and return success response with all variants
    const { getUserCredits } = await import("@/lib/db/users");
    const creditsRemaining = await getUserCredits(user.id);

    return NextResponse.json({
      url: blobUrl,
      filename: outputFilename,
      promptId,
      sculptokUrl: selectedImageUrl,
      allVariants: imgRecords, // All 3 variants for future use
      message: "Depth map generated successfully via SculptOK API",
      creditsRemaining,
    });

  } catch (error: any) {
    console.error("Depth map error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate depth map",
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}

