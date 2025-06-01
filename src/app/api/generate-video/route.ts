import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { 
      imageUrl, 
      prompt, 
      duration = 5, 
      aspectRatio = '16:9',
      motion = 'medium',
      creativityLevel = 0.5,
      model = 'kling-v1'
    } = await request.json();

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: 'Image URL and prompt are required' },
        { status: 400 }
      );
    }

    const klingApiKey = process.env.KLING_API_KEY;
    if (!klingApiKey) {
      return NextResponse.json(
        { error: 'Kling API key not configured' },
        { status: 500 }
      );
    }

    console.log('Generating video with Kling API:', { 
      imageUrl: imageUrl.substring(0, 50) + '...', 
      prompt: prompt.substring(0, 100),
      duration,
      aspectRatio,
      motion
    });

    // Kling API video generation request
    const klingResponse = await fetch('https://api.klingai.com/v1/video/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${klingApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        mode: 'image_to_video',
        image: imageUrl,
        prompt: prompt,
        duration: duration,
        aspect_ratio: aspectRatio,
        motion_strength: motion,
        creativity: creativityLevel,
        cfg_scale: 7.5,
        seed: Math.floor(Math.random() * 1000000)
      }),
    });

    if (!klingResponse.ok) {
      const errorData = await klingResponse.json().catch(() => ({}));
      console.error('Kling API Error:', {
        status: klingResponse.status,
        statusText: klingResponse.statusText,
        error: errorData
      });

      return NextResponse.json(
        { 
          error: 'Video generation failed',
          details: errorData.message || errorData.error || 'Unknown error',
          status: klingResponse.status
        },
        { status: 500 }
      );
    }

    const result = await klingResponse.json();
    
    // Kling API returns a task ID for async processing
    return NextResponse.json({
      success: true,
      taskId: result.id,
      status: result.status || 'processing',
      estimatedTime: result.estimated_time || duration * 10, // Rough estimate
      model: model,
      parameters: {
        prompt,
        duration,
        aspectRatio,
        motion,
        creativityLevel
      }
    });

  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}