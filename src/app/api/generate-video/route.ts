import { NextRequest, NextResponse } from 'next/server';
import { KlingJWTManager } from '@/lib/kling-jwt';

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

    // NEW SYSTEM: JWT Authentication with Access Key and Secret Key
    const klingAccessKey = process.env.KLING_ACCESS_KEY;
    const klingSecretKey = process.env.KLING_SECRET_KEY;
    
    if (!klingAccessKey || !klingSecretKey) {
      return NextResponse.json(
        { 
          error: 'Kling AI credentials not configured',
          details: 'Both KLING_ACCESS_KEY and KLING_SECRET_KEY are required for JWT authentication'
        },
        { status: 500 }
      );
    }

    // Generate JWT token for authentication
    const jwtManager = new KlingJWTManager(klingAccessKey, klingSecretKey);
    const authToken = jwtManager.getValidToken();

    console.log('Generating video with Kling AI (NEW SYSTEM + JWT):', { 
      imageUrl: imageUrl.substring(0, 50) + '...', 
      prompt: prompt.substring(0, 100),
      duration,
      aspectRatio,
      motion,
      model,
      endpoint: 'api-singapore.klingai.com',
      authMethod: 'JWT'
    });

    const requestStart = Date.now();

    // NEW: Kling API video generation request using updated endpoint + JWT
    const klingResponse = await fetch('https://api-singapore.klingai.com/v1/video/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'fal-image-editor/1.0.0'
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

    const requestDuration = Date.now() - requestStart;

    if (!klingResponse.ok) {
      const errorData = await klingResponse.json().catch(() => ({}));
      
      // Enhanced error logging for new system
      console.error('Kling API Error (NEW SYSTEM + JWT):', {
        status: klingResponse.status,
        statusText: klingResponse.statusText,
        error: errorData,
        endpoint: 'api-singapore.klingai.com',
        authMethod: 'JWT',
        requestDuration,
        timestamp: new Date().toISOString()
      });

      // Enhanced error response with specific error codes
      let errorMessage = 'Video generation failed';
      let errorCode = 'GENERATION_FAILED';

      switch (klingResponse.status) {
        case 400:
          errorMessage = 'Invalid request parameters';
          errorCode = 'INVALID_PARAMETERS';
          break;
        case 401:
          errorMessage = 'JWT authentication failed - check Access Key and Secret Key';
          errorCode = 'JWT_AUTH_FAILED';
          break;
        case 403:
          errorMessage = 'JWT token invalid or expired';
          errorCode = 'JWT_TOKEN_INVALID';
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
          timestamp: new Date().toISOString(),
          authMethod: 'JWT'
        },
        { status: klingResponse.status >= 500 ? 500 : 400 }
      );
    }

    const result = await klingResponse.json();
    
    // Enhanced logging for successful requests with usage tracking
    console.log('Kling API Success (NEW SYSTEM + JWT):', {
      taskId: result.id,
      model,
      requestDuration,
      estimatedCost: duration === 5 ? '$0.12' : '$0.24',
      timestamp: new Date().toISOString(),
      endpoint: 'api-singapore.klingai.com',
      authMethod: 'JWT'
    });
    
    // NEW SYSTEM: Enhanced response with real-time data
    return NextResponse.json({
      success: true,
      taskId: result.id,
      status: result.status || 'processing',
      estimatedTime: result.estimated_time || duration * 10,
      model: model,
      parameters: {
        prompt,
        duration,
        aspectRatio,
        motion,
        creativityLevel
      },
      // NEW: Real-time usage data
      usage: {
        requestDuration,
        estimatedCost: duration === 5 ? '$0.12' : '$0.24',
        timestamp: new Date().toISOString(),
        apiVersion: 'new-system',
        authMethod: 'JWT'
      },
      // NEW: System metadata
      system: {
        endpoint: 'api-singapore.klingai.com',
        realTimeUpdates: true,
        instantDataDisplay: true,
        authMethod: 'JWT',
        jwtTokenUsed: true
      }
    });

  } catch (error) {
    console.error('Video generation error (NEW SYSTEM + JWT):', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      endpoint: 'api-singapore.klingai.com',
      authMethod: 'JWT'
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to generate video',
        errorCode: 'SYSTEM_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        authMethod: 'JWT'
      },
      { status: 500 }
    );
  }
}