import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

interface ImageMetadata {
  fileName: string;
  url: string;
  localUrl: string;
  width: number;
  height: number;
  prompt: string;
  seed: number;
  modelUsed?: string;
  finetuneId?: string;
  timestamp: number;
}

const getMetadataFilePath = () => join(process.cwd(), "public", "gallery-metadata.json");

export async function GET() {
  try {
    const metadataPath = getMetadataFilePath();
    
    if (!existsSync(metadataPath)) {
      console.log("Metadata file doesn't exist yet, returning empty array");
      return NextResponse.json({
        success: true,
        metadata: []
      });
    }

    const fileContent = await readFile(metadataPath, 'utf-8');
    const metadata: ImageMetadata[] = JSON.parse(fileContent);
    
    console.log(`Loaded ${metadata.length} metadata entries from file`);
    
    return NextResponse.json({
      success: true,
      metadata
    });
  } catch (error) {
    console.error("Error loading metadata:", error);
    return NextResponse.json(
      { 
        error: "Failed to load metadata", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { metadata }: { metadata: ImageMetadata[] } = await request.json();
    
    if (!Array.isArray(metadata)) {
      return NextResponse.json(
        { error: "Metadata must be an array" },
        { status: 400 }
      );
    }

    const metadataPath = getMetadataFilePath();
    const publicDir = join(process.cwd(), "public");
    
    // Ensure public directory exists
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true });
    }

    // Save metadata to file
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    
    console.log(`Saved ${metadata.length} metadata entries to file`);
    
    return NextResponse.json({
      success: true,
      saved: metadata.length
    });
  } catch (error) {
    console.error("Error saving metadata:", error);
    return NextResponse.json(
      { 
        error: "Failed to save metadata", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 