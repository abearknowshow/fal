"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { 
  Check, 
  X, 
  Maximize2, 
  Lock, 
  Unlock,
  RotateCcw,
  Expand,
  Move
} from "lucide-react";
import { AspectRatio, ASPECT_RATIOS, CanvasResizeOptions } from "@/types/image-editor";

interface CanvasToolProps {
  currentWidth: number;
  currentHeight: number;
  onResize: (options: CanvasResizeOptions) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export function CanvasTool({ 
  currentWidth, 
  currentHeight, 
  onResize, 
  onCancel, 
  isProcessing 
}: CanvasToolProps) {
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>(ASPECT_RATIOS[0]); // Free
  const [width, setWidth] = useState(currentWidth);
  const [height, setHeight] = useState(currentHeight);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [lockAspectRatio, setLockAspectRatio] = useState(false);
  const [maintainCenter, setMaintainCenter] = useState(true);
  const [scaleContent, setScaleContent] = useState(false);
  const [mode, setMode] = useState<'aspect' | 'custom' | 'extend'>('aspect');

  // Calculate current aspect ratio
  const currentRatio = currentWidth / currentHeight;

  // Update dimensions when aspect ratio changes
  useEffect(() => {
    if (selectedRatio.id === 'free') return;
    if (selectedRatio.id === 'custom') return;

    if (selectedRatio.ratio > 0) {
      // Calculate new dimensions maintaining the larger dimension
      const newRatio = selectedRatio.ratio;
      
      if (newRatio > currentRatio) {
        // Wider ratio - expand width
        const newWidth = Math.round(currentHeight * newRatio);
        setWidth(newWidth);
        setHeight(currentHeight);
      } else {
        // Taller ratio - expand height  
        const newHeight = Math.round(currentWidth / newRatio);
        setWidth(currentWidth);
        setHeight(newHeight);
      }
    }
  }, [selectedRatio, currentWidth, currentHeight, currentRatio]);

  const handleRatioChange = (ratioId: string) => {
    const ratio = ASPECT_RATIOS.find(r => r.id === ratioId) || ASPECT_RATIOS[0];
    setSelectedRatio(ratio);
    
    if (ratio.id === 'custom') {
      setMode('custom');
      setCustomWidth(width.toString());
      setCustomHeight(height.toString());
    } else {
      setMode('aspect');
    }
  };

  const handleCustomDimensionChange = (dimension: 'width' | 'height', value: string) => {
    const numValue = parseInt(value) || 0;
    
    if (dimension === 'width') {
      setCustomWidth(value);
      if (lockAspectRatio && numValue > 0) {
        const newHeight = Math.round(numValue / currentRatio);
        setCustomHeight(newHeight.toString());
        setHeight(newHeight);
      }
      setWidth(numValue);
    } else {
      setCustomHeight(value);
      if (lockAspectRatio && numValue > 0) {
        const newWidth = Math.round(numValue * currentRatio);
        setCustomWidth(newWidth.toString());
        setWidth(newWidth);
      }
      setHeight(numValue);
    }
  };

  const handleApplyResize = () => {
    let finalWidth = width;
    let finalHeight = height;

    if (mode === 'custom') {
      finalWidth = parseInt(customWidth) || currentWidth;
      finalHeight = parseInt(customHeight) || currentHeight;
    }

    onResize({
      width: finalWidth,
      height: finalHeight,
      aspectRatio: selectedRatio,
      maintainCenter,
      scaleContent
    });
  };

  const resetToOriginal = () => {
    setWidth(currentWidth);
    setHeight(currentHeight);
    setSelectedRatio(ASPECT_RATIOS[0]); // Free
    setMode('aspect');
    setCustomWidth(currentWidth.toString());
    setCustomHeight(currentHeight.toString());
  };

  const getPreviewDimensions = () => {
    if (mode === 'custom') {
      return {
        width: parseInt(customWidth) || currentWidth,
        height: parseInt(customHeight) || currentHeight
      };
    }
    return { width, height };
  };

  const preview = getPreviewDimensions();
  const hasChanges = preview.width !== currentWidth || preview.height !== currentHeight;
  const isValidSize = preview.width > 0 && preview.height > 0 && preview.width <= 8192 && preview.height <= 8192;

  // Quick size presets
  const sizePresets = [
    { name: 'Instagram Post', width: 1080, height: 1080, ratio: '1:1' },
    { name: 'Instagram Story', width: 1080, height: 1920, ratio: '9:16' },
    { name: 'YouTube Thumbnail', width: 1280, height: 720, ratio: '16:9' },
    { name: 'Facebook Cover', width: 1200, height: 630, ratio: '16:9' },
    { name: 'Twitter Header', width: 1500, height: 500, ratio: '3:1' },
    { name: 'LinkedIn Post', width: 1200, height: 1200, ratio: '1:1' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Maximize2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Canvas Size</h2>
              <p className="text-sm text-muted-foreground">
                Current: {currentWidth} × {currentHeight}px
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isProcessing}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-6">
            {/* Mode Selection */}
            <div className="flex gap-2">
              <Button
                variant={mode === 'aspect' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('aspect')}
                className="flex-1"
              >
                <Expand className="h-4 w-4 mr-2" />
                Aspect Ratio
              </Button>
              <Button
                variant={mode === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setMode('custom');
                  setSelectedRatio(ASPECT_RATIOS.find(r => r.id === 'custom')!);
                }}
                className="flex-1"
              >
                <Move className="h-4 w-4 mr-2" />
                Custom Size
              </Button>
            </div>

            {/* Aspect Ratio Mode */}
            {mode === 'aspect' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                  <Select value={selectedRatio.id} onValueChange={handleRatioChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS.filter(r => r.id !== 'custom').map((ratio) => (
                        <SelectItem key={ratio.id} value={ratio.id}>
                          {ratio.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRatio.id !== 'free' && (
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-sm font-medium mb-1">New Size</div>
                    <div className="text-lg">{width} × {height}px</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Ratio: {selectedRatio.ratio > 0 ? selectedRatio.ratio.toFixed(2) : 'Free'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Custom Size Mode */}
            {mode === 'custom' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLockAspectRatio(!lockAspectRatio)}
                    className="flex items-center gap-2"
                  >
                    {lockAspectRatio ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    {lockAspectRatio ? 'Locked' : 'Free'}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Current ratio: {currentRatio.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="customWidth">Width (px)</Label>
                    <Input
                      id="customWidth"
                      type="number"
                      value={customWidth}
                      onChange={(e) => handleCustomDimensionChange('width', e.target.value)}
                      min="1"
                      max="8192"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customHeight">Height (px)</Label>
                    <Input
                      id="customHeight"
                      type="number"
                      value={customHeight}
                      onChange={(e) => handleCustomDimensionChange('height', e.target.value)}
                      min="1"
                      max="8192"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Presets */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Quick Presets</Label>
              <div className="grid grid-cols-1 gap-2">
                {sizePresets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (mode === 'custom') {
                        setCustomWidth(preset.width.toString());
                        setCustomHeight(preset.height.toString());
                        setWidth(preset.width);
                        setHeight(preset.height);
                      } else {
                        setWidth(preset.width);
                        setHeight(preset.height);
                        const ratio = ASPECT_RATIOS.find(r => r.name.includes(preset.ratio));
                        if (ratio) setSelectedRatio(ratio);
                      }
                    }}
                    className="justify-between text-left"
                  >
                    <span>{preset.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {preset.width}×{preset.height}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3 pt-3 border-t border-border">
              <Label className="text-sm font-medium">Resize Options</Label>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm">Center content</div>
                  <div className="text-xs text-muted-foreground">Keep layers centered in new canvas</div>
                </div>
                <Button
                  variant={maintainCenter ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setMaintainCenter(!maintainCenter);
                    if (!maintainCenter) setScaleContent(false);
                  }}
                >
                  {maintainCenter ? "On" : "Off"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm">Scale content</div>
                  <div className="text-xs text-muted-foreground">Smart resize with quality preservation</div>
                </div>
                <Button
                  variant={scaleContent ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setScaleContent(!scaleContent);
                    if (!scaleContent) setMaintainCenter(false);
                  }}
                >
                  {scaleContent ? "On" : "Off"}
                </Button>
              </div>

              {scaleContent && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-700 text-sm">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    Smart Scaling Active
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Uses high-quality algorithms to preserve image sharpness during resize
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Preview</Label>
            
            <div className="relative bg-muted rounded-lg p-4 min-h-[300px] flex items-center justify-center">
              {/* Current canvas outline */}
              <div className="relative">
                <div 
                  className="border-2 border-dashed border-muted-foreground/30 bg-background/50"
                  style={{
                    width: Math.min(200, currentWidth * 0.2),
                    height: Math.min(200, currentHeight * 0.2),
                  }}
                />
                <div className="absolute -bottom-6 left-0 text-xs text-muted-foreground">
                  Current: {currentWidth}×{currentHeight}
                </div>
                
                {/* New canvas outline */}
                {hasChanges && (
                  <div 
                    className="absolute top-0 left-0 border-2 border-primary bg-primary/10"
                    style={{
                      width: Math.min(200, preview.width * 0.2),
                      height: Math.min(200, preview.height * 0.2),
                    }}
                  />
                )}
              </div>
              
              {hasChanges && (
                <div className="absolute bottom-4 right-4 bg-background border border-border rounded-lg p-2 text-xs">
                  <div className="font-medium">New: {preview.width}×{preview.height}</div>
                  <div className="text-muted-foreground">
                    {preview.width > currentWidth || preview.height > currentHeight ? 'Expanding' : 'Shrinking'}
                  </div>
                </div>
              )}
            </div>

            {/* Size comparison */}
            {hasChanges && (
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="text-sm font-medium">Size Changes</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground">Width</div>
                    <div className={preview.width > currentWidth ? 'text-green-600' : preview.width < currentWidth ? 'text-red-600' : ''}>
                      {currentWidth} → {preview.width}
                      {preview.width !== currentWidth && (
                        <span className="ml-1">
                          ({preview.width > currentWidth ? '+' : ''}{preview.width - currentWidth})
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Height</div>
                    <div className={preview.height > currentHeight ? 'text-green-600' : preview.height < currentHeight ? 'text-red-600' : ''}>
                      {currentHeight} → {preview.height}
                      {preview.height !== currentHeight && (
                        <span className="ml-1">
                          ({preview.height > currentHeight ? '+' : ''}{preview.height - currentHeight})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <Button variant="outline" onClick={resetToOriginal} disabled={isProcessing}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              onClick={handleApplyResize} 
              disabled={isProcessing || !hasChanges || !isValidSize}
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Resizing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Apply Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}