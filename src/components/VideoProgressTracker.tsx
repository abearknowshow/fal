"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Download, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Eye,
  RotateCcw
} from "lucide-react";
import { VideoStatusResult, GeneratedVideo } from "@/types/video-generation";

interface VideoProgressTrackerProps {
  taskId: string;
  initialProgress?: number;
  onComplete: (video: GeneratedVideo) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  checkVideoStatus: (taskId: string) => Promise<VideoStatusResult>;
  parameters: {
    prompt: string;
    duration: number;
    aspectRatio: string;
    motion: string;
    model: string;
    creativityLevel: number;
    imageUrl?: string;
  };
}

export function VideoProgressTracker({
  taskId,
  initialProgress = 0,
  onComplete,
  onError,
  onCancel,
  checkVideoStatus,
  parameters
}: VideoProgressTrackerProps) {
  const [status, setStatus] = useState<VideoStatusResult>({
    taskId,
    status: 'processing',
    progress: initialProgress
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPolling, setIsPolling] = useState(true);

  // Track elapsed time
  useEffect(() => {
    if (status.status !== 'processing') return;

    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [status.status]);

  // Poll for status updates
  useEffect(() => {
    if (!isPolling || status.status !== 'processing') return;

    const pollInterval = setInterval(async () => {
      try {
        const result = await checkVideoStatus(taskId);
        setStatus(result);

        if (result.status === 'completed' && result.videoUrl) {
          const generatedVideo: GeneratedVideo = {
            id: `video_${Date.now()}`,
            taskId,
            videoUrl: result.videoUrl,
            thumbnailUrl: result.thumbnailUrl,
            prompt: parameters.prompt || '',
            sourceImageUrl: parameters.imageUrl || '',
            duration: result.duration || parameters.duration || 5,
            aspectRatio: parameters.aspectRatio || '16:9',
            model: parameters.model || 'kling-v1',
            timestamp: Date.now(),
            status: 'completed',
            parameters: {
              ...parameters,
              imageUrl: parameters.imageUrl || '',
              aspectRatio: parameters.aspectRatio as '16:9' | '9:16' | '1:1',
              motion: parameters.motion as 'low' | 'medium' | 'high',
              model: parameters.model as 'kling-v1' | 'kling-v1.5'
            }
          };
          
          setIsPolling(false);
          onComplete(generatedVideo);
        } else if (result.status === 'failed') {
          setIsPolling(false);
          onError(result.error || 'Video generation failed');
        }
      } catch (error) {
        console.error('Error checking video status:', error);
        // Continue polling on individual failures
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isPolling, taskId, status.status, checkVideoStatus, onComplete, onError, parameters]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (status.progress !== undefined) {
      return status.progress;
    }
    // Estimate progress based on elapsed time (rough estimate)
    const estimatedTotal = parameters.duration * 10; // 10 seconds per video second
    return Math.min(95, (elapsedTime / estimatedTotal) * 100);
  };

  const progressPercent = getProgressPercentage();

  if (status.status === 'completed' && status.videoUrl) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {/* Success Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Video Generated Successfully!</h3>
              <p className="text-sm text-green-700">
                Your video is ready to view and download
              </p>
            </div>
          </div>

          {/* Video Preview */}
          <div className="bg-black rounded-lg overflow-hidden">
            <video
              src={status.videoUrl}
              poster={status.thumbnailUrl}
              controls
              className="w-full aspect-video"
              preload="metadata"
            >
              Your browser does not support video playback.
            </video>
          </div>

          {/* Video Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Duration:</span>
              <div className="font-medium">{status.duration || parameters.duration}s</div>
            </div>
            <div>
              <span className="text-muted-foreground">Generated in:</span>
              <div className="font-medium">{formatTime(elapsedTime)}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => window.open(status.videoUrl, '_blank')}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Full Size
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const link = document.createElement('a');
                link.href = status.videoUrl!;
                link.download = `generated_video_${Date.now()}.mp4`;
                link.click();
              }}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (status.status === 'failed') {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {/* Error Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-900">Video Generation Failed</h3>
              <p className="text-sm text-red-700">
                {status.error || 'An unexpected error occurred during generation'}
              </p>
            </div>
          </div>

          {/* Retry Button */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Processing state
  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Processing Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          </div>
          <div>
            <h3 className="font-semibold">Generating Video...</h3>
            <p className="text-sm text-muted-foreground">
              This may take several minutes depending on video length and complexity
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Status Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Elapsed Time:</span>
            <div className="font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(elapsedTime)}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Task ID:</span>
            <div className="font-mono text-xs">{taskId.substring(0, 8)}...</div>
          </div>
        </div>

        {/* Estimated Time Remaining */}
        {status.estimatedTimeRemaining && (
          <div className="text-sm">
            <span className="text-muted-foreground">Est. Time Remaining:</span>
            <div className="font-medium">{Math.round(status.estimatedTimeRemaining / 60)} minutes</div>
          </div>
        )}

        {/* Generation Details */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <div className="font-medium mb-2">Generation Settings:</div>
          <div className="space-y-1 text-muted-foreground">
            <div>Duration: {parameters.duration}s</div>
            <div>Aspect Ratio: {parameters.aspectRatio}</div>
            <div>Motion: {parameters.motion}</div>
            <div>Model: {parameters.model}</div>
          </div>
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <Button
            variant="outline"
            onClick={() => {
              setIsPolling(false);
              onCancel();
            }}
            className="w-full"
          >
            Cancel Generation
          </Button>
        )}
      </div>
    </Card>
  );
}