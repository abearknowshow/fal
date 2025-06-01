"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { CropArea } from "@/types/image-editor";

interface CropToolProps {
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  onCrop: (cropArea: CropArea) => void;
  onCancel: () => void;
}

export function CropTool({ 
  canvasWidth, 
  canvasHeight, 
  zoom, 
  onCrop, 
  onCancel 
}: CropToolProps) {
  const [cropArea, setCropArea] = useState<CropArea>({
    x: canvasWidth * 0.1,
    y: canvasHeight * 0.1,
    width: canvasWidth * 0.8,
    height: canvasHeight * 0.8
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
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

  const handleMouseDown = useCallback((e: React.MouseEvent, handle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;

    const imageBounds = getImageBounds();
    const x = (e.clientX - rect.left - imageBounds.x) / zoom;
    const y = (e.clientY - rect.top - imageBounds.y) / zoom;

    setIsDragging(true);
    setDragHandle(handle || 'move');
    setDragStart({ x, y });
  }, [zoom, getImageBounds]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragHandle) return;

    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;

    const imageBounds = getImageBounds();
    const x = (e.clientX - rect.left - imageBounds.x) / zoom;
    const y = (e.clientY - rect.top - imageBounds.y) / zoom;
    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;

    setCropArea(prev => {
      const newArea = { ...prev };

      switch (dragHandle) {
        case 'move':
          newArea.x = Math.max(0, Math.min(canvasWidth - prev.width, prev.x + deltaX));
          newArea.y = Math.max(0, Math.min(canvasHeight - prev.height, prev.y + deltaY));
          break;
        case 'nw':
          const newWidth = prev.width - deltaX;
          const newHeight = prev.height - deltaY;
          if (newWidth > 10 && newHeight > 10) {
            newArea.x = prev.x + deltaX;
            newArea.y = prev.y + deltaY;
            newArea.width = newWidth;
            newArea.height = newHeight;
          }
          break;
        case 'ne':
          const newWidthNE = prev.width + deltaX;
          const newHeightNE = prev.height - deltaY;
          if (newWidthNE > 10 && newHeightNE > 10) {
            newArea.y = prev.y + deltaY;
            newArea.width = newWidthNE;
            newArea.height = newHeightNE;
          }
          break;
        case 'sw':
          const newWidthSW = prev.width - deltaX;
          const newHeightSW = prev.height + deltaY;
          if (newWidthSW > 10 && newHeightSW > 10) {
            newArea.x = prev.x + deltaX;
            newArea.width = newWidthSW;
            newArea.height = newHeightSW;
          }
          break;
        case 'se':
          const newWidthSE = prev.width + deltaX;
          const newHeightSE = prev.height + deltaY;
          if (newWidthSE > 10 && newHeightSE > 10) {
            newArea.width = newWidthSE;
            newArea.height = newHeightSE;
          }
          break;
      }

      // Constrain to canvas bounds
      newArea.x = Math.max(0, Math.min(canvasWidth - newArea.width, newArea.x));
      newArea.y = Math.max(0, Math.min(canvasHeight - newArea.height, newArea.y));
      newArea.width = Math.min(canvasWidth - newArea.x, newArea.width);
      newArea.height = Math.min(canvasHeight - newArea.y, newArea.height);

      return newArea;
    });

    setDragStart({ x, y });
  }, [isDragging, dragHandle, dragStart, zoom, canvasWidth, canvasHeight, getImageBounds]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragHandle(null);
  }, []);

  const handleCrop = () => {
    onCrop(cropArea);
  };

  const imageBounds = getImageBounds();

  return (
    <div 
      ref={overlayRef}
      className="absolute inset-0 cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Overlay with crop area cutout - only over the image area */}
      <div className="absolute inset-0 bg-black bg-opacity-50">
        {/* Image area overlay with crop cutout */}
        <div
          className="absolute bg-black bg-opacity-50"
          style={{
            left: imageBounds.x,
            top: imageBounds.y,
            width: imageBounds.width,
            height: imageBounds.height,
          }}
        >
          {/* Top overlay */}
          <div 
            className="absolute top-0 left-0 right-0 bg-black bg-opacity-50"
            style={{ height: cropArea.y * zoom }}
          />
          
          {/* Bottom overlay */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50"
            style={{ height: (canvasHeight - cropArea.y - cropArea.height) * zoom }}
          />
          
          {/* Left overlay */}
          <div 
            className="absolute left-0 bg-black bg-opacity-50"
            style={{ 
              top: cropArea.y * zoom,
              width: cropArea.x * zoom,
              height: cropArea.height * zoom
            }}
          />
          
          {/* Right overlay */}
          <div 
            className="absolute right-0 bg-black bg-opacity-50"
            style={{ 
              top: cropArea.y * zoom,
              width: (canvasWidth - cropArea.x - cropArea.width) * zoom,
              height: cropArea.height * zoom
            }}
          />
        </div>
      </div>

      {/* Crop selection area */}
      <div
        className="absolute border-2 border-white border-dashed cursor-move"
        style={{
          left: imageBounds.x + cropArea.x * zoom,
          top: imageBounds.y + cropArea.y * zoom,
          width: cropArea.width * zoom,
          height: cropArea.height * zoom
        }}
        onMouseDown={(e) => handleMouseDown(e)}
      >
        {/* Corner handles */}
        <div
                      className="absolute -top-1 -left-1 w-3 h-3 bg-background border border-border cursor-nw-resize"
          onMouseDown={(e) => handleMouseDown(e, 'nw')}
        />
        <div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-background border border-border cursor-ne-resize"
          onMouseDown={(e) => handleMouseDown(e, 'ne')}
        />
        <div
                      className="absolute -bottom-1 -left-1 w-3 h-3 bg-background border border-border cursor-sw-resize"
          onMouseDown={(e) => handleMouseDown(e, 'sw')}
        />
        <div
                      className="absolute -bottom-1 -right-1 w-3 h-3 bg-background border border-border cursor-se-resize"
          onMouseDown={(e) => handleMouseDown(e, 'se')}
        />
        
        {/* Crop info */}
        <div className="absolute -top-8 left-0 bg-black bg-opacity-90 text-white text-xs px-3 py-2 rounded shadow-lg">
          {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Button size="sm" onClick={handleCrop}>
          <Check className="h-4 w-4 mr-1" />
          Crop
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  );
} 