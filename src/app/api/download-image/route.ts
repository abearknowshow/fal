import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, fileName } = await request.json();

    console.log(`Starting download for: ${fileName} from ${imageUrl}`);

    if (!imageUrl || !fileName) {
      console.error("Missing required parameters:", { imageUrl: !!imageUrl, fileName: !!fileName });
      return NextResponse.json(
        { error: "Image URL and fileName are required" },
        { status: 400 }
      );
    }

    // Create images directory if it doesn't exist
    const imagesDir = join(process.cwd(), "public", "images");
    if (!existsSync(imagesDir)) {
      console.log("Creating images directory:", imagesDir);
      await mkdir(imagesDir, { recursive: true });
    }

    // Download the image with timeout
    console.log(`Fetching image from: ${imageUrl}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'fal-image-downloader/1.0'
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`HTTP error fetching image: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    console.log(`Successfully fetched image, content-type: ${response.headers.get('content-type')}, content-length: ${response.headers.get('content-length')}`);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`Image buffer size: ${buffer.length} bytes`);

    // Save to public/images
    const filePath = join(imagesDir, fileName);
    await writeFile(filePath, buffer);

    console.log(`Successfully saved image to: ${filePath}`);

    const localUrl = `/images/${fileName}`;

    return NextResponse.json({
      success: true,
      localUrl,
      originalUrl: imageUrl,
      fileSize: buffer.length,
    });
  } catch (error) {
    console.error("Error downloading image:", error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { 
            error: "Download timeout", 
            details: "Image download took longer than 60 seconds" 
          },
          { status: 408 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: "Failed to download image", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 