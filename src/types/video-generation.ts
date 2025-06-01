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
  duration?: number;
  aspectRatio?: string;
  motion?: string;
  creativityLevel?: number;
  model?: string;
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
    description: 'Standard quality, faster generation',
    recommended: true 
  },
  { 
    value: 'kling-v1.5', 
    label: 'Kling v1.5', 
    description: 'Enhanced quality, more realistic motion' 
  }
] as const;