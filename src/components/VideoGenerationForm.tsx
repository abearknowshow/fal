"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Play, 
  Sparkles, 
  Clock, 
  Ratio, 
  Zap,
  Palette,
  Info,
  AlertCircle
} from "lucide-react";
import { 
  VideoGenerationParams,
  VIDEO_DURATIONS,
  VIDEO_ASPECT_RATIOS,
  VIDEO_MOTION_LEVELS,
  VIDEO_MODELS
} from "@/types/video-generation";

interface VideoGenerationFormProps {
  sourceImage?: string | null;
  initialPrompt?: string;
  onGenerate: (params: VideoGenerationParams) => void;
  isGenerating: boolean;
}

export function VideoGenerationForm({
  sourceImage,
  initialPrompt = "",
  onGenerate,
  isGenerating
}: VideoGenerationFormProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [duration, setDuration] = useState(5);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [motion, setMotion] = useState<'low' | 'medium' | 'high'>('medium');
  const [creativityLevel, setCreativityLevel] = useState(0.5);
  const [model, setModel] = useState<'kling-v1' | 'kling-v1.5'>('kling-v1');

  const handleGenerate = () => {
    if (!sourceImage || !prompt.trim()) return;

    const params: VideoGenerationParams = {
      imageUrl: sourceImage,
      prompt: prompt.trim(),
      duration,
      aspectRatio,
      motion,
      creativityLevel,
      model
    };

    onGenerate(params);
  };

  const selectedAspectRatio = VIDEO_ASPECT_RATIOS.find(ar => ar.value === aspectRatio);
  const selectedMotion = VIDEO_MOTION_LEVELS.find(ml => ml.value === motion);
  const selectedModel = VIDEO_MODELS.find(m => m.value === model);

  const estimatedCost = duration === 5 ? '$0.12' : '$0.24'; // Rough Kling API pricing
  const estimatedTime = `${duration * 8}-${duration * 12} seconds`; // Generation time estimate

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Play className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Generate Video</h2>
            <p className="text-sm text-muted-foreground">
              Transform your image into an AI-generated video
            </p>
          </div>
        </div>

        {/* Source Image Preview */}
        {sourceImage && (
          <div className="space-y-2">
            <Label>Source Image</Label>
            <div className="relative bg-muted rounded-lg p-4">
              <img
                src={sourceImage}
                alt="Source for video generation"
                className="max-h-32 mx-auto rounded object-contain"
              />
            </div>
          </div>
        )}

        {/* Video Prompt */}
        <div className="space-y-2">
          <Label htmlFor="video-prompt">
            Video Prompt *
            <span className="text-xs text-muted-foreground ml-2">
              Describe the motion and animation you want
            </span>
          </Label>
          <Textarea
            id="video-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A gentle breeze moves through the trees as sunlight filters through the leaves, creating dancing shadows..."
            className="min-h-20"
            disabled={isGenerating}
          />
          <div className="text-xs text-muted-foreground">
            {prompt.length}/500 characters
          </div>
        </div>

        {/* Generation Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Duration */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Duration
            </Label>
            <div className="space-y-2">
              {VIDEO_DURATIONS.map((dur) => (
                <label key={dur.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="duration"
                    value={dur.value}
                    checked={duration === dur.value}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    disabled={isGenerating}
                    className="w-4 h-4"
                  />
                  <span className="text-sm flex items-center gap-2">
                    {dur.label}
                    {'recommended' in dur && dur.recommended && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                        Recommended
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Ratio className="h-4 w-4" />
              Aspect Ratio
            </Label>
            <div className="space-y-2">
              {VIDEO_ASPECT_RATIOS.map((ar) => (
                <label key={ar.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="aspectRatio"
                    value={ar.value}
                    checked={aspectRatio === ar.value}
                    onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16' | '1:1')}
                    disabled={isGenerating}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">
                    {ar.label}
                    <span className="text-muted-foreground ml-1">
                      ({ar.width}×{ar.height})
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Motion Level */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Motion Intensity
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {VIDEO_MOTION_LEVELS.map((ml) => (
              <button
                key={ml.value}
                type="button"
                onClick={() => setMotion(ml.value)}
                disabled={isGenerating}
                className={`p-3 text-left rounded-lg border transition-all ${
                  motion === ml.value 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-border bg-background hover:bg-muted'
                }`}
              >
                <div className="font-medium text-sm">{ml.label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {ml.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Creativity Level */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Creativity Level: {Math.round(creativityLevel * 100)}%
          </Label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={creativityLevel}
            onChange={(e) => setCreativityLevel(parseFloat(e.target.value))}
            disabled={isGenerating}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Conservative (follows image closely)</span>
            <span>Creative (more artistic interpretation)</span>
          </div>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Model
          </Label>
          <div className="space-y-2">
            {VIDEO_MODELS.map((m) => (
              <label key={m.value} className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="model"
                  value={m.value}
                  checked={model === m.value}
                  onChange={(e) => setModel(e.target.value as 'kling-v1' | 'kling-v1.5')}
                  disabled={isGenerating}
                  className="w-4 h-4 mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{m.label}</span>
                    {'recommended' in m && m.recommended && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{m.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Generation Info */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Info className="h-4 w-4" />
            Generation Details
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Output:</span>
              <div className="font-medium">
                {selectedAspectRatio?.label} • {duration}s • {selectedMotion?.label} motion
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Model:</span>
              <div className="font-medium">{selectedModel?.label}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Est. Time:</span>
              <div className="font-medium">{estimatedTime}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Est. Cost:</span>
              <div className="font-medium">{estimatedCost}</div>
            </div>
          </div>
        </div>

        {/* API Key Warning */}
        {!process.env.NEXT_PUBLIC_HAS_KLING_KEY && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-amber-800 mb-1">
                  Kling API Key Required
                </div>
                <div className="text-amber-700">
                  Video generation requires a Kling API key. Add your key to the .env.local file to enable this feature.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!sourceImage || !prompt.trim() || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              Generating Video...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Generate Video
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}