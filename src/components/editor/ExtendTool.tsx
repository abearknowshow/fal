"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Expand, RotateCcw, Sparkles } from "lucide-react";
import { ExtendOptions, ExtendArea } from "@/types/image-editor";

interface ExtendToolProps {
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  onExtend: (options: ExtendOptions) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export function ExtendTool({ 
  canvasWidth, 
  canvasHeight, 
  zoom, 
  onExtend, 
  onCancel, 
  isProcessing 
}: ExtendToolProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  
  // Calculate the image bounds in the viewport (same as EditorCanvas)
  const getImageBounds = useCallback(() => {
    if (!overlayRef.current) return { x: 0, y: 0, width: 0, height: 0 };
    
    const container = overlayRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const imageWidth = canvasWidth * zoom;
    const imageHeight = canvasHeight * zoom;
    
    // Center the image in the viewport
    const x = (containerWidth - imageWidth) / 2;
    const y = (containerHeight - imageHeight) / 2;
    
    return { x, y, width: imageWidth, height: imageHeight };
  }, [canvasWidth, canvasHeight, zoom]);

  // State for extension (start with no extension - exactly matching image)
  const [extendArea, setExtendArea] = useState<ExtendArea>(() => ({
    x: 0,
    y: 0,
    width: canvasWidth,
    height: canvasHeight,
    originalX: 0,
    originalY: 0,
    originalWidth: canvasWidth,
    originalHeight: canvasHeight
  }));
  
  const [prompt, setPrompt] = useState('');
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);

  // Initialize extend area to match image bounds exactly
  useEffect(() => {
    const bounds = getImageBounds();
    if (bounds.width > 0 && bounds.height > 0) {
      setExtendArea({
        x: 0,
        y: 0,
        width: canvasWidth,
        height: canvasHeight,
        originalX: 0,
        originalY: 0,
        originalWidth: canvasWidth,
        originalHeight: canvasHeight
      });
    }
  }, [canvasWidth, canvasHeight, zoom, getImageBounds]);

  const handleMouseDown = useCallback((e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDragHandle(handle);
    
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
  }, [getImageBounds]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragHandle) return;

    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;

    const imageBounds = getImageBounds();
    const x = (e.clientX - rect.left - imageBounds.x) / zoom;
    const y = (e.clientY - rect.top - imageBounds.y) / zoom;

    setExtendArea(prev => {
      const newArea = { ...prev };
      const minExtension = 20; // Minimum extension amount

      switch (dragHandle) {
        case 'top':
          const newTop = Math.min(y, prev.originalY - minExtension);
          newArea.y = newTop;
          newArea.height = prev.originalY + prev.originalHeight - newTop;
          break;
        case 'bottom':
          const newHeight = Math.max(y - prev.originalY, prev.originalHeight + minExtension);
          newArea.height = newHeight;
          break;
        case 'left':
          const newLeft = Math.min(x, prev.originalX - minExtension);
          newArea.x = newLeft;
          newArea.width = prev.originalX + prev.originalWidth - newLeft;
          break;
        case 'right':
          const newWidth = Math.max(x - prev.originalX, prev.originalWidth + minExtension);
          newArea.width = newWidth;
          break;
      }

      // Constrain to reasonable bounds
      const maxSize = Math.max(canvasWidth, canvasHeight) * 3;
      newArea.width = Math.min(newArea.width, maxSize);
      newArea.height = Math.min(newArea.height, maxSize);

      return newArea;
    });
  }, [isDragging, dragHandle, zoom, canvasWidth, canvasHeight, getImageBounds]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragHandle(null);
  }, []);

  const handleExtend = () => {
    onExtend({
      extendArea,
      prompt: prompt.trim() || undefined
    });
  };

  const handleReset = () => {
    setExtendArea({
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
      originalX: 0,
      originalY: 0,
      originalWidth: canvasWidth,
      originalHeight: canvasHeight
    });
  };

  // Calculate extension amounts
  const getExtensionAmounts = useCallback(() => {
    const topExtension = Math.max(0, extendArea.originalY - extendArea.y);
    const bottomExtension = Math.max(0, (extendArea.y + extendArea.height) - (extendArea.originalY + extendArea.originalHeight));
    const leftExtension = Math.max(0, extendArea.originalX - extendArea.x);
    const rightExtension = Math.max(0, (extendArea.x + extendArea.width) - (extendArea.originalX + extendArea.originalWidth));
    
    return { topExtension, bottomExtension, leftExtension, rightExtension };
  }, [extendArea]);

  const { topExtension, bottomExtension, leftExtension, rightExtension } = getExtensionAmounts();
  const hasExtension = topExtension > 0 || bottomExtension > 0 || leftExtension > 0 || rightExtension > 0;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && hasExtension && !isProcessing) {
        e.preventDefault();
        handleExtend();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onCancel, hasExtension, isProcessing]);

  const imageBounds = getImageBounds();

  return (
    <div 
      ref={overlayRef}
      className="absolute inset-0"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Tool Icon */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-2 border">
        <Expand className="h-5 w-5 text-primary" />
      </div>

      {/* Extension preview areas */}
      {topExtension > 0 && (
        <div 
          className="absolute bg-blue-500/30 border-2 border-blue-500 border-dashed"
          style={{
            left: imageBounds.x + extendArea.x * zoom,
            top: imageBounds.y + extendArea.y * zoom,
            width: extendArea.width * zoom,
            height: topExtension * zoom
          }}
        />
      )}
      {bottomExtension > 0 && (
        <div 
          className="absolute bg-blue-500/30 border-2 border-blue-500 border-dashed"
          style={{
            left: imageBounds.x + extendArea.x * zoom,
            top: imageBounds.y + (extendArea.originalY + extendArea.originalHeight) * zoom,
            width: extendArea.width * zoom,
            height: bottomExtension * zoom
          }}
        />
      )}
      {leftExtension > 0 && (
        <div 
          className="absolute bg-blue-500/30 border-2 border-blue-500 border-dashed"
          style={{
            left: imageBounds.x + extendArea.x * zoom,
            top: imageBounds.y + extendArea.y * zoom,
            width: leftExtension * zoom,
            height: extendArea.height * zoom
          }}
        />
      )}
      {rightExtension > 0 && (
        <div 
          className="absolute bg-blue-500/30 border-2 border-blue-500 border-dashed"
          style={{
            left: imageBounds.x + (extendArea.originalX + extendArea.originalWidth) * zoom,
            top: imageBounds.y + extendArea.y * zoom,
            width: rightExtension * zoom,
            height: extendArea.height * zoom
          }}
        />
      )}

      {/* Original image outline */}
      <div
        className="absolute border-2 border-white bg-white/10"
        style={{
          left: imageBounds.x + extendArea.originalX * zoom,
          top: imageBounds.y + extendArea.originalY * zoom,
          width: extendArea.originalWidth * zoom,
          height: extendArea.originalHeight * zoom
        }}
      />

      {/* Extension handles - only show on edges */}
      <div
        className="absolute border-2 border-blue-500"
        style={{
          left: imageBounds.x + extendArea.x * zoom,
          top: imageBounds.y + extendArea.y * zoom,
          width: extendArea.width * zoom,
          height: extendArea.height * zoom
        }}
      >
        {/* Top handle */}
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-blue-500 border-2 border-white rounded cursor-n-resize flex items-center justify-center"
          onMouseDown={(e) => handleMouseDown(e, 'top')}
        >
          <div className="w-1 h-1 bg-white rounded-full"></div>
        </div>

        {/* Bottom handle */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-blue-500 border-2 border-white rounded cursor-s-resize flex items-center justify-center"
          onMouseDown={(e) => handleMouseDown(e, 'bottom')}
        >
          <div className="w-1 h-1 bg-white rounded-full"></div>
        </div>

        {/* Left handle */}
        <div
          className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-blue-500 border-2 border-white rounded cursor-w-resize flex items-center justify-center"
          onMouseDown={(e) => handleMouseDown(e, 'left')}
        >
          <div className="w-1 h-1 bg-white rounded-full"></div>
        </div>

        {/* Right handle */}
        <div
          className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-blue-500 border-2 border-white rounded cursor-e-resize flex items-center justify-center"
          onMouseDown={(e) => handleMouseDown(e, 'right')}
        >
          <div className="w-1 h-1 bg-white rounded-full"></div>
        </div>
      </div>

      {/* Extension info */}
      {hasExtension && (
        <div className="absolute top-16 left-4 bg-black/90 text-white text-sm px-3 py-2 rounded-lg">
          Extension: +{Math.round(Math.max(topExtension, bottomExtension, leftExtension, rightExtension))}px
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={handleExtend} 
            disabled={isProcessing || !hasExtension}
          >
            {isProcessing ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Extend
          </Button>
          {hasExtension && (
            <Button variant="outline" size="sm" onClick={handleReset} disabled={isProcessing}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isProcessing}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowPromptInput(!showPromptInput)}
          disabled={isProcessing}
        >
          {showPromptInput ? 'Hide' : 'Add'} Prompt
        </Button>
      </div>

      {/* Prompt input */}
      {showPromptInput && !isProcessing && (
        <div className="absolute top-20 right-4 w-80 bg-white rounded-lg shadow-lg p-3 border">
          <label className="text-sm font-medium mb-2 block">
            Extension Prompt (Optional)
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what should be generated in the extended area..."
            className="min-h-[60px] text-sm"
          />
        </div>
      )}

      {/* Instructions */}
      {!hasExtension && !isProcessing && (
        <div className="absolute bottom-4 left-4 bg-black/90 text-white text-sm px-4 py-3 rounded-lg max-w-sm">
          <div className="font-medium mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Extend Image:
          </div>
          <div>Drag the blue handles to extend the image in any direction. The blue area shows what will be generated.</div>
        </div>
      )}
    </div>
  );
}