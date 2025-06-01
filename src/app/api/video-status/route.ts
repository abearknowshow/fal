import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
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

    console.log('Checking video status for task:', taskId);

    // Check video generation status
    const klingResponse = await fetch(`https://api.klingai.com/v1/video/generations/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${klingApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!klingResponse.ok) {
      const errorData = await klingResponse.json().catch(() => ({}));
      console.error('Kling API Status Error:', {
        status: klingResponse.status,
        statusText: klingResponse.statusText,
        error: errorData
      });

      return NextResponse.json(
        { 
          error: 'Failed to check video status',
          details: errorData.message || errorData.error || 'Unknown error',
          status: klingResponse.status
        },
        { status: 500 }
      );
    }

    const result = await klingResponse.json();
    
    // Map Kling API status to our status format
    const statusMap = {
      'pending': 'processing',
      'processing': 'processing', 
      'running': 'processing',
      'succeeded': 'completed',
      'failed': 'failed',
      'cancelled': 'failed'
    };

    const mappedStatus = statusMap[result.status as keyof typeof statusMap] || 'processing';
    
    const response = {
      taskId,
      status: mappedStatus,
      progress: result.progress || (mappedStatus === 'completed' ? 100 : undefined),
      estimatedTimeRemaining: result.estimated_time_remaining,
      videoUrl: result.output?.video_url,
      thumbnailUrl: result.output?.thumbnail_url,
      duration: result.output?.duration,
      error: result.error_message
    };

    // If completed, include video metadata
    if (mappedStatus === 'completed' && result.output) {
      response.videoUrl = result.output.video_url;
      response.thumbnailUrl = result.output.thumbnail_url;
      response.duration = result.output.duration;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Video status check error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check video status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}