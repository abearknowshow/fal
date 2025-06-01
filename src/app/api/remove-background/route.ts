import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

// Configure Fal AI client
fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    console.log('Processing image URL:', imageUrl.substring(0, 50) + '...');

    let processedImageUrl = imageUrl;

    // Handle different URL types
    if (imageUrl.startsWith('data:image/')) {
      // For data URLs (base64), upload to FAL storage first
      console.log('Uploading data URL to FAL storage...');
      
      try {
        // Convert data URL to blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        // Upload to FAL storage using the correct API
        const uploadResult = await fal.storage.upload(blob);
        console.log('Upload result:', uploadResult);
        
        if (!uploadResult) {
          throw new Error('Upload failed - no result returned');
        }
        
        // FAL storage upload returns a string URL directly, not an object
        processedImageUrl = typeof uploadResult === 'string' ? uploadResult : (uploadResult as { url: string }).url;
        console.log('Uploaded to FAL storage:', processedImageUrl);
      } catch (uploadError) {
        console.error('FAL storage upload failed:', uploadError);
        
        // Fallback: Save image locally and use serve-image endpoint
        console.log('Falling back to local storage...');
        try {
          const { writeFile, mkdir } = await import('fs/promises');
          const { join } = await import('path');
          const { existsSync } = await import('fs');
          
          // Ensure images directory exists
          const imagesDir = join(process.cwd(), 'public', 'images');
          if (!existsSync(imagesDir)) {
            await mkdir(imagesDir, { recursive: true });
          }
          
          // Convert data URL to buffer
          const base64Data = imageUrl.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Save to public/images directory
          const filename = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
          const filepath = join(imagesDir, filename);
          await writeFile(filepath, buffer);
          
          // Use serve-image endpoint
          const publicUrl = `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/serve-image?path=${encodeURIComponent('/images/' + filename)}`;
          processedImageUrl = publicUrl;
          console.log('Using fallback local storage:', processedImageUrl);
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          throw new Error('Failed to process image - both FAL storage and local fallback failed');
        }
      }
      
    } else if (imageUrl.startsWith('/images/')) {
      // For local paths, create a public URL that FAL can access
      const publicUrl = `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/serve-image?path=${encodeURIComponent(imageUrl)}`;
      processedImageUrl = publicUrl;
      console.log('Using public URL:', processedImageUrl);
    }

    // Use FAL's background removal model
    const result = await fal.subscribe('fal-ai/birefnet', {
      input: {
        image_url: processedImageUrl
      },
    });

    if (!result.data?.image?.url) {
      throw new Error('No processed image returned');
    }

    return NextResponse.json({
      imageUrl: result.data.image.url
    });

  } catch (error) {
    console.error('Background removal failed:', error);
    return NextResponse.json(
      { error: 'Failed to remove background', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 