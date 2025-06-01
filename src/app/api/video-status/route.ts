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

    console.log('Checking video status (NEW SYSTEM):', { 
      taskId,
      endpoint: 'api-singapore.klingai.com',
      timestamp: new Date().toISOString()
    });

    const requestStart = Date.now();

    // NEW: Check video generation status using updated endpoint
    const klingResponse = await fetch(`https://api-singapore.klingai.com/v1/video/generations/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${klingApiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'fal-image-editor/1.0.0'
      },
    });

    const requestDuration = Date.now() - requestStart;

    if (!klingResponse.ok) {
      const errorData = await klingResponse.json().catch(() => ({}));
      
      // Enhanced error logging for new system
      console.error('Kling API Status Error (NEW SYSTEM):', {
        status: klingResponse.status,
        statusText: klingResponse.statusText,
        error: errorData,
        taskId,
        endpoint: 'api-singapore.klingai.com',
        requestDuration,
        timestamp: new Date().toISOString()
      });

      // Enhanced error response with specific error codes
      let errorMessage = 'Failed to check video status';
      let errorCode = 'STATUS_CHECK_FAILED';

      switch (klingResponse.status) {
        case 400:
          errorMessage = 'Invalid task ID or request parameters';
          errorCode = 'INVALID_TASK_ID';
          break;
        case 401:
          errorMessage = 'Invalid API key or authentication failed';
          errorCode = 'AUTH_FAILED';
          break;
        case 404:
          errorMessage = 'Task not found';
          errorCode = 'TASK_NOT_FOUND';
          break;
        case 429:
          errorMessage = 'Rate limit exceeded. Please try again later';
          errorCode = 'RATE_LIMIT_EXCEEDED';
          break;
        case 500:
          errorMessage = 'Kling AI service error';
          errorCode = 'SERVICE_ERROR';
          break;
      }

      return NextResponse.json(
        { 
          error: errorMessage,
          errorCode,
          details: errorData.message || errorData.error || 'Unknown error',
          status: klingResponse.status,
          taskId,
          timestamp: new Date().toISOString()
        },
        { status: klingResponse.status >= 500 ? 500 : 400 }
      );
    }

    const result = await klingResponse.json();
    
    // Enhanced status mapping for new system
    const statusMap = {
      'pending': 'processing',
      'processing': 'processing', 
      'running': 'processing',
      'succeeded': 'completed',
      'failed': 'failed',
      'cancelled': 'failed'
    };

    const mappedStatus = statusMap[result.status as keyof typeof statusMap] || 'processing';
    
    // Enhanced logging for status checks with real-time data
    console.log('Kling API Status Success (NEW SYSTEM):', {
      taskId,
      status: mappedStatus,
      originalStatus: result.status,
      progress: result.progress,
      requestDuration,
      timestamp: new Date().toISOString(),
      endpoint: 'api-singapore.klingai.com'
    });
    
    const response: any = {
      taskId,
      status: mappedStatus,
      progress: result.progress || (mappedStatus === 'completed' ? 100 : undefined),
      estimatedTimeRemaining: result.estimated_time_remaining,
      videoUrl: result.output?.video_url,
      thumbnailUrl: result.output?.thumbnail_url,
      duration: result.output?.duration,
      error: result.error_message,
      // NEW: Real-time usage and status data
      usage: {
        requestDuration,
        statusCheckCount: 1, // Could be tracked in a more sophisticated way
        timestamp: new Date().toISOString(),
        apiVersion: 'new-system'
      },
      // NEW: Enhanced metadata
      metadata: {
        originalStatus: result.status,
        endpoint: 'api-singapore.klingai.com',
        realTimeUpdates: true,
        instantDataDisplay: true,
        lastChecked: new Date().toISOString()
      }
    };

    // If completed, include enhanced video metadata
    if (mappedStatus === 'completed' && result.output) {
      response.videoUrl = result.output.video_url;
      response.thumbnailUrl = result.output.thumbnail_url;
      response.duration = result.output.duration;
      
      // NEW: Additional completion metadata
      response.metadata = {
        originalStatus: result.status,
        endpoint: 'api-singapore.klingai.com',
        realTimeUpdates: true,
        instantDataDisplay: true,
        lastChecked: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        processingTime: result.processing_time,
        fileSize: result.output.file_size,
        resolution: result.output.resolution
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Video status check error (NEW SYSTEM):', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      endpoint: 'api-singapore.klingai.com'
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to check video status',
        errorCode: 'SYSTEM_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}