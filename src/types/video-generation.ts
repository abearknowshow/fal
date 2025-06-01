export interface VideoGenerationParams {
  imageUrl: string;
  prompt: string;
  duration: number; // seconds: 5, 10
  aspectRatio: '16:9' | '9:16' | '1:1';
  motion: 'low' | 'medium' | 'high';
  creativityLevel: number; // 0-1
  model: 'kling-v1' | 'kling-v1.5';
}

export interface VideoGenerationResult {
  success: boolean;
  taskId: string;
  status: VideoStatus;
  estimatedTime?: number;
  model: string;
  parameters: Partial<VideoGenerationParams>;
  error?: string;
}

export interface VideoStatusResult {
  taskId: string;
  status: VideoStatus;
  progress?: number;
  estimatedTimeRemaining?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
}

export type VideoStatus = 'processing' | 'completed' | 'failed';

export interface VideoGenerationRequest {
  imageUrl: string;
  prompt: string;
  duration: 5 | 10;
  aspectRatio: '16:9' | '9:16' | '1:1';
  motion: 'low' | 'medium' | 'high';
  creativityLevel: number;
  model: 'kling-v1' | 'kling-v1.5';
}

export interface VideoGenerationResponse {
  success: boolean;
  taskId: string;
  status: string;
  estimatedTime: number;
  model: string;
  parameters: {
    prompt: string;
    duration: number;
    aspectRatio: string;
    motion: string;
    creativityLevel: number;
  };
  // NEW SYSTEM: Real-time usage data
  usage: {
    requestDuration: number;
    estimatedCost: string;
    timestamp: string;
    apiVersion: 'new-system';
  };
  // NEW SYSTEM: System metadata
  system: {
    endpoint: 'api-singapore.klingai.com';
    realTimeUpdates: boolean;
    instantDataDisplay: boolean;
  };
  error?: string;
  errorCode?: string;
}

export interface VideoStatusResponse {
  taskId: string;
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  estimatedTimeRemaining?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
  // NEW SYSTEM: Real-time usage and status data
  usage: {
    requestDuration: number;
    statusCheckCount: number;
    timestamp: string;
    apiVersion: 'new-system';
  };
  // NEW SYSTEM: Enhanced metadata
  metadata: {
    originalStatus: string;
    endpoint: 'api-singapore.klingai.com';
    realTimeUpdates: boolean;
    instantDataDisplay: boolean;
    lastChecked: string;
    completedAt?: string;
    processingTime?: number;
    fileSize?: number;
    resolution?: string;
  };
}

// NEW SYSTEM: Usage Analytics Types
export interface UsageAnalyticsRequest {
  apiKey?: string;
  productType?: 'video' | 'image' | 'all';
  timeStart?: string;
  timeEnd?: string;
  limit?: number;
}

export interface UsageAnalyticsResponse {
  success: boolean;
  data: {
    summary: {
      totalCalls: number;
      totalUnitsDeduced: number;
      totalCost: string;
      period: {
        start: string;
        end: string;
      };
      realTimeUpdates: boolean;
      instantDataDisplay: boolean;
    };
    breakdown: {
      byModel: Record<string, {
        calls: number;
        unitsDeduced: number;
        cost: string;
        averageProcessingTime: string;
      }>;
      byDuration: Record<string, {
        calls: number;
        unitsDeduced: number;
        cost: string;
      }>;
      byDay: Array<{
        date: string;
        calls: number;
        unitsDeduced: number;
        cost: string;
      }>;
    };
    recent: Array<{
      id: string;
      timestamp: string;
      model: string;
      duration: number;
      status: string;
      unitsDeduced: number;
      cost: string;
      processingTime: string;
    }>;
    system: {
      endpoint: 'api-singapore.klingai.com';
      realTimeUpdates: boolean;
      dataDelay: 'instant';
      lastUpdated: string;
      features: string[];
    };
  };
  meta: {
    apiVersion: 'new-system';
    generatedAt: string;
    realTimeData: boolean;
  };
}

// NEW SYSTEM: Usage Event Tracking
export interface UsageEventRequest {
  event: 'video_generation_start' | 'video_generation_complete' | 'video_generation_failed' | 'status_check';
  data: {
    taskId?: string;
    model?: string;
    duration?: number;
    cost?: string;
    processingTime?: number;
    [key: string]: string | number | boolean | undefined;
  };
}

export interface UsageEventResponse {
  success: boolean;
  eventRecord: {
    id: string;
    event: string;
    data: Record<string, string | number | boolean | undefined>;
    timestamp: string;
    processed: boolean;
    realTime: boolean;
  };
  meta: {
    realTimeProcessing: boolean;
    instantDataUpdates: boolean;
    apiVersion: 'new-system';
  };
}

export interface VideoProgress {
  taskId: string;
  progress: number;
  status: 'processing' | 'completed' | 'failed';
  estimatedTimeRemaining?: number;
  model: 'kling-v1' | 'kling-v1.5';
  parameters: {
    prompt: string;
    duration: number;
    aspectRatio: string;
    motion: string;
    creativityLevel: number;
  };
  // NEW SYSTEM: Enhanced progress tracking
  usage: {
    statusChecks: number;
    totalDuration: number;
    realTimeUpdates: boolean;
  };
}

export interface GeneratedVideo {
  id: string;
  taskId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  prompt: string;
  sourceImageUrl: string;
  duration: number;
  aspectRatio: string;
  model: string;
  timestamp: number;
  status: VideoStatus;
  parameters: VideoGenerationParams;
}

export interface VideoMetadata {
  videos: GeneratedVideo[];
}

// Video quality presets
export const VIDEO_DURATIONS = [
  { value: 5, label: '5 seconds', recommended: true },
  { value: 10, label: '10 seconds' }
] as const;

export const VIDEO_ASPECT_RATIOS = [
  { value: '16:9', label: 'Landscape (16:9)', width: 1280, height: 720 },
  { value: '9:16', label: 'Portrait (9:16)', width: 720, height: 1280 },
  { value: '1:1', label: 'Square (1:1)', width: 1024, height: 1024 }
] as const;

export const VIDEO_MOTION_LEVELS = [
  { value: 'low', label: 'Subtle', description: 'Minimal movement, gentle animations' },
  { value: 'medium', label: 'Balanced', description: 'Moderate movement, natural motion' },
  { value: 'high', label: 'Dynamic', description: 'Strong movement, dramatic effects' }
] as const;

export const VIDEO_MODELS = [
  {
    value: 'kling-v1',
    label: 'Kling v1',
    description: 'Stable model with reliable results',
    cost: '$0.12 per 5s, $0.24 per 10s',
    // NEW SYSTEM: Enhanced model metadata
    system: {
      endpoint: 'api-singapore.klingai.com',
      realTimeSupport: true,
      instantDataUpdates: true
    }
  },
  {
    value: 'kling-v1.5',
    label: 'Kling v1.5',
    description: 'Latest model with improved quality',
    cost: '$0.12 per 5s, $0.24 per 10s',
    // NEW SYSTEM: Enhanced model metadata
    system: {
      endpoint: 'api-singapore.klingai.com',
      realTimeSupport: true,
      instantDataUpdates: true
    }
  }
] as const;

// NEW SYSTEM: Error Codes for enhanced error handling
export const KLING_ERROR_CODES = {
  GENERATION_FAILED: 'GENERATION_FAILED',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  AUTH_FAILED: 'AUTH_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SERVICE_ERROR: 'SERVICE_ERROR',
  STATUS_CHECK_FAILED: 'STATUS_CHECK_FAILED',
  INVALID_TASK_ID: 'INVALID_TASK_ID',
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  ANALYTICS_ERROR: 'ANALYTICS_ERROR',
  EVENT_RECORDING_ERROR: 'EVENT_RECORDING_ERROR'
} as const;

export type KlingErrorCode = keyof typeof KLING_ERROR_CODES;