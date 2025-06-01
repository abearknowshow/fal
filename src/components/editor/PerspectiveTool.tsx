"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EditorLayer } from "@/types/image-editor";
import { 
  Move3D, 
  RotateCw, 
  Grid3X3, 
  Eye,
  EyeOff,
  FlipHorizontal,
  FlipVertical,
  Check,
  X,
  Undo2
} from "lucide-react";

interface PerspectiveToolProps {
  layer: EditorLayer;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  onLayerUpdate: (layerId: string, updates: Partial<EditorLayer>) => void;
  onCancel: () => void;
  onApply: () => void;
  getImageBounds: () => { x: number; y: number; width: number; height: number };
}

type PerspectiveMode = 'perspective' | 'skew' | 'distort' | 'flip';
type CornerHandle = 'tl' | 'tr' | 'bl' | 'br';

interface PerspectiveCorner {
  x: number;
  y: number;
}

interface PerspectiveState {
  topLeft: PerspectiveCorner;
  topRight: PerspectiveCorner;
  bottomLeft: PerspectiveCorner;
  bottomRight: PerspectiveCorner;
}

export function PerspectiveTool({
  layer,
  zoom,
  canvasWidth,
  canvasHeight,
  onLayerUpdate,
  onCancel,
  onApply,
  getImageBounds
}: PerspectiveToolProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const [mode, setMode] = useState<PerspectiveMode>('perspective');
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<CornerHandle | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [previewTransform, setPreviewTransform] = useState(true);
  
  // Initialize perspective corners to match current layer bounds
  const [perspectiveState, setPerspectiveState] = useState<PerspectiveState>(() => ({
    topLeft: { x: layer.x, y: layer.y },
    topRight: { x: layer.x + layer.width, y: layer.y },
    bottomLeft: { x: layer.x, y: layer.y + layer.height },
    bottomRight: { x: layer.x + layer.width, y: layer.y + layer.height }
  }));
  
  const [originalState] = useState<PerspectiveState>(() => ({
    topLeft: { x: layer.x, y: layer.y },
    topRight: { x: layer.x + layer.width, y: layer.y },
    bottomLeft: { x: layer.x, y: layer.y + layer.height },
    bottomRight: { x: layer.x + layer.width, y: layer.y + layer.height }
  }));

  const imageBounds = getImageBounds();


  // Handle mouse events for corner dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, handle: CornerHandle) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDragHandle(handle);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragHandle || !overlayRef.current) return;
    
    const rect = overlayRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - imageBounds.x) / zoom;
    const y = (e.clientY - rect.top - imageBounds.y) / zoom;
    
    // Constrain to canvas bounds
    const constrainedX = Math.max(0, Math.min(canvasWidth, x));
    const constrainedY = Math.max(0, Math.min(canvasHeight, y));
    
    setPerspectiveState(prev => ({
      ...prev,
      [dragHandle === 'tl' ? 'topLeft' :
       dragHandle === 'tr' ? 'topRight' :
       dragHandle === 'bl' ? 'bottomLeft' : 'bottomRight']: {
        x: constrainedX,
        y: constrainedY
      }
    }));
  }, [isDragging, dragHandle, imageBounds, zoom, canvasWidth, canvasHeight]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragHandle(null);
  }, []);

  // Set up global mouse events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Perspective presets
  const applyPerspectivePreset = (preset: string) => {
    const width = layer.width;
    const height = layer.height;
    
    let newState: PerspectiveState;
    
    switch (preset) {
      case 'front-tilt':
        newState = {
          topLeft: { x: layer.x + width * 0.1, y: layer.y },
          topRight: { x: layer.x + width * 0.9, y: layer.y },
          bottomLeft: { x: layer.x, y: layer.y + height },
          bottomRight: { x: layer.x + width, y: layer.y + height }
        };
        break;
      case 'back-tilt':
        newState = {
          topLeft: { x: layer.x, y: layer.y },
          topRight: { x: layer.x + width, y: layer.y },
          bottomLeft: { x: layer.x + width * 0.1, y: layer.y + height },
          bottomRight: { x: layer.x + width * 0.9, y: layer.y + height }
        };
        break;
      case 'left-tilt':
        newState = {
          topLeft: { x: layer.x, y: layer.y + height * 0.1 },
          topRight: { x: layer.x + width, y: layer.y },
          bottomLeft: { x: layer.x, y: layer.y + height * 0.9 },
          bottomRight: { x: layer.x + width, y: layer.y + height }
        };
        break;
      case 'right-tilt':
        newState = {
          topLeft: { x: layer.x, y: layer.y },
          topRight: { x: layer.x + width, y: layer.y + height * 0.1 },
          bottomLeft: { x: layer.x, y: layer.y + height },
          bottomRight: { x: layer.x + width, y: layer.y + height * 0.9 }
        };
        break;
      default:
        newState = originalState;
    }
    
    setPerspectiveState(newState);
  };

  // Flip operations
  const handleFlip = (direction: 'horizontal' | 'vertical') => {
    if (direction === 'horizontal') {
      setPerspectiveState(prev => ({
        topLeft: prev.topRight,
        topRight: prev.topLeft,
        bottomLeft: prev.bottomRight,
        bottomRight: prev.bottomLeft
      }));
    } else {
      setPerspectiveState(prev => ({
        topLeft: prev.bottomLeft,
        topRight: prev.bottomRight,
        bottomLeft: prev.topLeft,
        bottomRight: prev.topRight
      }));
    }
  };

  // Reset to original state
  const handleReset = () => {
    setPerspectiveState(originalState);
  };

  // Apply transformation
  const handleApplyTransform = () => {
    // In a real implementation, you would:
    // 1. Create a new canvas with the transformed image
    // 2. Apply the perspective transformation using WebGL or advanced canvas techniques
    // 3. Update the layer with the new image data
    
    // For now, we'll apply basic transformations that can be represented with CSS
    const { topLeft, topRight, bottomLeft, bottomRight } = perspectiveState;
    
    // Calculate bounding box of the transformed shape
    const minX = Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
    const maxX = Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
    const minY = Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);
    const maxY = Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);
    
    // Update layer position and add transform data
    onLayerUpdate(layer.id, {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      // Store perspective data for rendering
      perspectiveTransform: {
        topLeft: { x: topLeft.x - minX, y: topLeft.y - minY },
        topRight: { x: topRight.x - minX, y: topRight.y - minY },
        bottomLeft: { x: bottomLeft.x - minX, y: bottomLeft.y - minY },
        bottomRight: { x: bottomRight.x - minX, y: bottomRight.y - minY }
      }
    });
    
    onApply();
  };

  // Render corner handle
  const renderCornerHandle = (corner: PerspectiveCorner, handle: CornerHandle, className: string) => (
    <div
      key={handle}
      className={`absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-sm shadow-lg hover:bg-blue-50 cursor-move ${className}`}
      style={{
        left: imageBounds.x + corner.x * zoom - 8,
        top: imageBounds.y + corner.y * zoom - 8,
        transform: `scale(${1 / zoom})`,
        transformOrigin: 'center'
      }}
      onMouseDown={(e) => handleMouseDown(e, handle)}
    />
  );

  return (
    <div 
      ref={overlayRef}
      className="absolute inset-0"
    >
      {/* Grid overlay */}
      {showGrid && (
        <div 
          className="absolute pointer-events-none opacity-20"
          style={{
            left: imageBounds.x,
            top: imageBounds.y,
            width: imageBounds.width,
            height: imageBounds.height,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: `${40 * zoom}px ${40 * zoom}px`
          }}
        />
      )}

      {/* Perspective outline */}
      <svg
        className="absolute pointer-events-none"
        style={{
          left: imageBounds.x,
          top: imageBounds.y,
          width: imageBounds.width,
          height: imageBounds.height
        }}
      >
        <polygon
          points={`
            ${perspectiveState.topLeft.x * zoom},${perspectiveState.topLeft.y * zoom}
            ${perspectiveState.topRight.x * zoom},${perspectiveState.topRight.y * zoom}
            ${perspectiveState.bottomRight.x * zoom},${perspectiveState.bottomRight.y * zoom}
            ${perspectiveState.bottomLeft.x * zoom},${perspectiveState.bottomLeft.y * zoom}
          `}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        
        {/* Corner guidelines */}
        <g stroke="#3b82f6" strokeWidth="1" opacity="0.5">
          <line 
            x1={perspectiveState.topLeft.x * zoom} 
            y1={perspectiveState.topLeft.y * zoom}
            x2={perspectiveState.bottomRight.x * zoom}
            y2={perspectiveState.bottomRight.y * zoom}
          />
          <line 
            x1={perspectiveState.topRight.x * zoom} 
            y1={perspectiveState.topRight.y * zoom}
            x2={perspectiveState.bottomLeft.x * zoom}
            y2={perspectiveState.bottomLeft.y * zoom}
          />
        </g>
      </svg>

      {/* Corner handles */}
      <div className="pointer-events-auto">
        {renderCornerHandle(perspectiveState.topLeft, 'tl', '')}
        {renderCornerHandle(perspectiveState.topRight, 'tr', '')}
        {renderCornerHandle(perspectiveState.bottomLeft, 'bl', '')}
        {renderCornerHandle(perspectiveState.bottomRight, 'br', '')}
      </div>

      {/* Controls Panel */}
      <div className="absolute top-4 right-4 flex flex-col gap-3">
        {/* Mode Selection */}
        <Card className="p-3">
          <div className="text-xs font-medium mb-2 text-gray-600">Transform Mode</div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={mode === 'perspective' ? "default" : "outline"}
              size="sm"
              onClick={() => setMode('perspective')}
              className="justify-start"
            >
              <Move3D className="h-3 w-3 mr-1" />
              Perspective
            </Button>
            <Button
              variant={mode === 'skew' ? "default" : "outline"}
              size="sm"
              onClick={() => setMode('skew')}
              className="justify-start"
            >
              <RotateCw className="h-3 w-3 mr-1" />
              Skew
            </Button>
            <Button
              variant={mode === 'distort' ? "default" : "outline"}
              size="sm"
              onClick={() => setMode('distort')}
              className="justify-start"
            >
              <Grid3X3 className="h-3 w-3 mr-1" />
              Distort
            </Button>
            <Button
              variant={mode === 'flip' ? "default" : "outline"}
              size="sm"
              onClick={() => setMode('flip')}
              className="justify-start"
            >
              <FlipHorizontal className="h-3 w-3 mr-1" />
              Flip
            </Button>
          </div>
        </Card>

        {/* Perspective Presets */}
        {mode === 'perspective' && (
          <Card className="p-3">
            <div className="text-xs font-medium mb-2 text-gray-600">Perspective Presets</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPerspectivePreset('front-tilt')}
                className="text-xs"
              >
                Front Tilt
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPerspectivePreset('back-tilt')}
                className="text-xs"
              >
                Back Tilt
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPerspectivePreset('left-tilt')}
                className="text-xs"
              >
                Left Tilt
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPerspectivePreset('right-tilt')}
                className="text-xs"
              >
                Right Tilt
              </Button>
            </div>
          </Card>
        )}

        {/* Flip Controls */}
        {mode === 'flip' && (
          <Card className="p-3">
            <div className="text-xs font-medium mb-2 text-gray-600">Flip Options</div>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFlip('horizontal')}
                className="w-full justify-start"
              >
                <FlipHorizontal className="h-3 w-3 mr-2" />
                Flip Horizontal
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFlip('vertical')}
                className="w-full justify-start"
              >
                <FlipVertical className="h-3 w-3 mr-2" />
                Flip Vertical
              </Button>
            </div>
          </Card>
        )}

        {/* Display Options */}
        <Card className="p-3">
          <div className="text-xs font-medium mb-2 text-gray-600">Display</div>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              className="w-full justify-start"
            >
              {showGrid ? <Eye className="h-3 w-3 mr-2" /> : <EyeOff className="h-3 w-3 mr-2" />}
              {showGrid ? 'Hide' : 'Show'} Grid
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewTransform(!previewTransform)}
              className="w-full justify-start"
            >
              {previewTransform ? <Eye className="h-3 w-3 mr-2" /> : <EyeOff className="h-3 w-3 mr-2" />}
              {previewTransform ? 'Hide' : 'Show'} Preview
            </Button>
          </div>
        </Card>

        {/* Action Buttons */}
        <Card className="p-3">
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="w-full justify-start"
            >
              <Undo2 className="h-3 w-3 mr-2" />
              Reset
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="flex-1"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleApplyTransform}
                className="flex-1"
              >
                <Check className="h-3 w-3 mr-1" />
                Apply
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}