import { useState, useCallback, useRef } from 'react';
import { 
  VideoGenerationParams, 
  VideoGenerationResult, 
  VideoStatusResult,
  GeneratedVideo 
} from '@/types/video-generation';

interface UseVideoGenerationReturn {
  generateVideo: (params: VideoGenerationParams) => Promise<VideoGenerationResult>;
  checkVideoStatus: (taskId: string) => Promise<VideoStatusResult>;
  isGenerating: boolean;
  currentTask: string | null;
  progress: number;
  error: string | null;
  videos: GeneratedVideo[];
  addGeneratedVideo: (video: GeneratedVideo) => void;
  pollVideoStatus: (taskId: string, onComplete: (result: VideoStatusResult) => void) => void;
  stopPolling: () => void;
}

export function useVideoGeneration(): UseVideoGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateVideo = useCallback(async (params: VideoGenerationParams): Promise<VideoGenerationResult> => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Video generation failed');
      }

      setCurrentTask(result.taskId);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsGenerating(false);
      throw new Error(errorMessage);
    }
  }, []);

  const checkVideoStatus = useCallback(async (taskId: string): Promise<VideoStatusResult> => {
    try {
      const response = await fetch(`/api/video-status?taskId=${encodeURIComponent(taskId)}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to check status');
      }

      // Update progress if available
      if (result.progress !== undefined) {
        setProgress(result.progress);
      }

      // Handle completion or failure
      if (result.status === 'completed') {
        setIsGenerating(false);
        setCurrentTask(null);
        setProgress(100);
      } else if (result.status === 'failed') {
        setIsGenerating(false);
        setCurrentTask(null);
        setError(result.error || 'Video generation failed');
      }

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsGenerating(false);
      throw new Error(errorMessage);
    }
  }, []);

  const pollVideoStatus = useCallback((
    taskId: string, 
    onComplete: (result: VideoStatusResult) => void
  ) => {
    // Clear any existing polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const pollInterval = 3000; // Poll every 3 seconds
    let pollCount = 0;
    const maxPolls = 200; // Maximum 10 minutes of polling

    const poll = async () => {
      try {
        pollCount++;
        
        if (pollCount > maxPolls) {
          setError('Video generation timed out');
          setIsGenerating(false);
          stopPolling();
          return;
        }

        const result = await checkVideoStatus(taskId);
        
        if (result.status === 'completed') {
          onComplete(result);
          stopPolling();
        } else if (result.status === 'failed') {
          setError(result.error || 'Video generation failed');
          stopPolling();
        }
        // Continue polling if still processing
        
      } catch (error) {
        console.error('Error polling video status:', error);
        // Don't stop polling on individual request failures
      }
    };

    // Start polling immediately, then at intervals
    poll();
    pollIntervalRef.current = setInterval(poll, pollInterval);
  }, [checkVideoStatus]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const addGeneratedVideo = useCallback((video: GeneratedVideo) => {
    setVideos(prev => [video, ...prev]);
  }, []);

  return {
    generateVideo,
    checkVideoStatus,
    isGenerating,
    currentTask,
    progress,
    error,
    videos,
    addGeneratedVideo,
    pollVideoStatus,
    stopPolling
  };
}