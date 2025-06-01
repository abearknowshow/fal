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

    // Use FAL's background removal model
    const result = await fal.subscribe('fal-ai/birefnet', {
      input: {
        image_url: imageUrl
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
      { error: 'Failed to remove background' },
      { status: 500 }
    );
  }
} 