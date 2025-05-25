import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

interface ImageFileInfo {
  fileName: string;
  localUrl: string;
  fileSize: number;
  lastModified: number;
}

export async function GET() {
  try {
    const imagesDir = join(process.cwd(), "public", "images");
    
    if (!existsSync(imagesDir)) {
      console.log("Images directory doesn't exist yet");
      return NextResponse.json({
        success: true,
        images: []
      });
    }

    const files = await readdir(imagesDir);
    const imageFiles = files.filter(file => 
      file.toLowerCase().endsWith('.png') || 
      file.toLowerCase().endsWith('.jpg') || 
      file.toLowerCase().endsWith('.jpeg')
    );

    const imageInfos: ImageFileInfo[] = [];

    for (const fileName of imageFiles) {
      try {
        const filePath = join(imagesDir, fileName);
        const fileStat = await stat(filePath);
        
        imageInfos.push({
          fileName,
          localUrl: `/images/${fileName}`,
          fileSize: fileStat.size,
          lastModified: fileStat.mtimeMs
        });
      } catch (error) {
        console.error(`Error reading file ${fileName}:`, error);
      }
    }

    // Sort by last modified (newest first)
    imageInfos.sort((a, b) => b.lastModified - a.lastModified);

    console.log(`Found ${imageInfos.length} image files in directory`);

    return NextResponse.json({
      success: true,
      images: imageInfos
    });
  } catch (error) {
    console.error("Error scanning images directory:", error);
    return NextResponse.json(
      { 
        error: "Failed to scan images directory", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 