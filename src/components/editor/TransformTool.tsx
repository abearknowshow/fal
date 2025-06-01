"use client";

import { useState, useCallback, useEffect } from "react";
import { EditorLayer } from "@/types/image-editor";

interface TransformToolProps {
  layer: EditorLayer;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  onLayerUpdate: (layerId: string, updates: Partial<EditorLayer>) => void;
  getImageBounds: () => { x: number; y: number; width: number; height: number };
}

type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate' | 'move';

export function TransformTool({ 
  layer, 
  zoom, 
  canvasWidth, 
  canvasHeight, 
  onLayerUpdate, 
  getImageBounds 
}: TransformToolProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<HandleType | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialLayer, setInitialLayer] = useState<EditorLayer | null>(null);
  const [showRotateHandle, setShowRotateHandle] = useState(false);

  const imageBounds = getImageBounds();

  // Calculate layer bounds in screen coordinates
  const getLayerBounds = useCallback(() => {
    return {
      x: imageBounds.x + layer.x * zoom,
      y: imageBounds.y + layer.y * zoom,
      width: layer.width * zoom,
      height: layer.height * zoom
    };
  }, [layer, zoom, imageBounds]);

  const layerBounds = getLayerBounds();

  // Handle mouse down on transform handles
  const handleMouseDown = useCallback((e: React.MouseEvent, handleType: HandleType) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDragHandle(handleType);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialLayer({ ...layer });
  }, [layer]);

  // Handle mouse move during transform
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragHandle || !initialLayer) return;

    const deltaX = (e.clientX - dragStart.x) / zoom;
    const deltaY = (e.clientY - dragStart.y) / zoom;

    let updates: Partial<EditorLayer> = {};

    switch (dragHandle) {
      case 'move':
        // Move the layer
        const newX = Math.max(0, Math.min(canvasWidth - layer.width, initialLayer.x + deltaX));
        const newY = Math.max(0, Math.min(canvasHeight - layer.height, initialLayer.y + deltaY));
        updates = { x: newX, y: newY };
        break;

      case 'nw':
        // Northwest corner - resize from top-left
        const nwDeltaX = Math.min(deltaX, initialLayer.width - 20); // Min width 20px
        const nwDeltaY = Math.min(deltaY, initialLayer.height - 20); // Min height 20px
        updates = {
          x: initialLayer.x + nwDeltaX,
          y: initialLayer.y + nwDeltaY,
          width: initialLayer.width - nwDeltaX,
          height: initialLayer.height - nwDeltaY
        };
        break;

      case 'ne':
        // Northeast corner - resize from top-right
        const neDeltaY = Math.min(deltaY, initialLayer.height - 20);
        updates = {
          y: initialLayer.y + neDeltaY,
          width: Math.max(20, initialLayer.width + deltaX),
          height: initialLayer.height - neDeltaY
        };
        break;

      case 'se':
        // Southeast corner - resize from bottom-right
        updates = {
          width: Math.max(20, initialLayer.width + deltaX),
          height: Math.max(20, initialLayer.height + deltaY)
        };
        break;

      case 'sw':
        // Southwest corner - resize from bottom-left
        const swDeltaX = Math.min(deltaX, initialLayer.width - 20);
        updates = {
          x: initialLayer.x + swDeltaX,
          width: initialLayer.width - swDeltaX,
          height: Math.max(20, initialLayer.height + deltaY)
        };
        break;

      case 'n':
        // North edge - resize height from top
        const nDeltaY = Math.min(deltaY, initialLayer.height - 20);
        updates = {
          y: initialLayer.y + nDeltaY,
          height: initialLayer.height - nDeltaY
        };
        break;

      case 's':
        // South edge - resize height from bottom
        updates = {
          height: Math.max(20, initialLayer.height + deltaY)
        };
        break;

      case 'w':
        // West edge - resize width from left
        const wDeltaX = Math.min(deltaX, initialLayer.width - 20);
        updates = {
          x: initialLayer.x + wDeltaX,
          width: initialLayer.width - wDeltaX
        };
        break;

      case 'e':
        // East edge - resize width from right
        updates = {
          width: Math.max(20, initialLayer.width + deltaX)
        };
        break;

      case 'rotate':
        // Calculate rotation based on mouse position relative to layer center
        const centerX = imageBounds.x + (layer.x + layer.width / 2) * zoom;
        const centerY = imageBounds.y + (layer.y + layer.height / 2) * zoom;
        
        const initialAngle = Math.atan2(dragStart.y - centerY, dragStart.x - centerX);
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        const rotationDelta = (currentAngle - initialAngle) * (180 / Math.PI);
        
        updates = {
          rotation: (initialLayer.rotation + rotationDelta) % 360
        };
        break;
    }

    // Ensure layer stays within canvas bounds
    if (updates.x !== undefined) {
      updates.x = Math.max(0, Math.min(canvasWidth - (updates.width || layer.width), updates.x));
    }
    if (updates.y !== undefined) {
      updates.y = Math.max(0, Math.min(canvasHeight - (updates.height || layer.height), updates.y));
    }

    onLayerUpdate(layer.id, updates);
  }, [isDragging, dragHandle, dragStart, initialLayer, layer, zoom, imageBounds, canvasWidth, canvasHeight, onLayerUpdate]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragHandle(null);
    setInitialLayer(null);
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

  // Handle styles for different cursors
  const getHandleCursor = (handleType: HandleType): string => {
    switch (handleType) {
      case 'nw': case 'se': return 'nw-resize';
      case 'ne': case 'sw': return 'ne-resize';
      case 'n': case 's': return 'ns-resize';
      case 'e': case 'w': return 'ew-resize';
      case 'rotate': return 'grab';
      case 'move': return 'move';
      default: return 'default';
    }
  };

  // Render transform handles
  const renderHandle = (handleType: HandleType, x: number, y: number, className: string = '') => (
    <div
      key={handleType}
      className={`absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm shadow-lg hover:bg-blue-50 cursor-${getHandleCursor(handleType)} ${className}`}
      style={{
        left: x - 6,
        top: y - 6,
        cursor: getHandleCursor(handleType)
      }}
      onMouseDown={(e) => handleMouseDown(e, handleType)}
    />
  );

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Layer outline */}
      <div
        className="absolute border-2 border-blue-500 border-dashed pointer-events-none"
        style={{
          left: layerBounds.x,
          top: layerBounds.y,
          width: layerBounds.width,
          height: layerBounds.height,
          transform: `rotate(${layer.rotation}deg)`,
          transformOrigin: 'center'
        }}
      />

      {/* Move handle (invisible overlay) */}
      <div
        className="absolute cursor-move"
        style={{
          left: layerBounds.x,
          top: layerBounds.y,
          width: layerBounds.width,
          height: layerBounds.height,
          pointerEvents: 'auto'
        }}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
        onMouseEnter={() => setShowRotateHandle(true)}
        onMouseLeave={() => setShowRotateHandle(false)}
      />

      {/* Corner handles */}
      <div className="pointer-events-auto">
        {/* Northwest */}
        {renderHandle('nw', layerBounds.x, layerBounds.y)}
        
        {/* North */}
        {renderHandle('n', layerBounds.x + layerBounds.width / 2, layerBounds.y)}
        
        {/* Northeast */}
        {renderHandle('ne', layerBounds.x + layerBounds.width, layerBounds.y)}
        
        {/* East */}
        {renderHandle('e', layerBounds.x + layerBounds.width, layerBounds.y + layerBounds.height / 2)}
        
        {/* Southeast */}
        {renderHandle('se', layerBounds.x + layerBounds.width, layerBounds.y + layerBounds.height)}
        
        {/* South */}
        {renderHandle('s', layerBounds.x + layerBounds.width / 2, layerBounds.y + layerBounds.height)}
        
        {/* Southwest */}
        {renderHandle('sw', layerBounds.x, layerBounds.y + layerBounds.height)}
        
        {/* West */}
        {renderHandle('w', layerBounds.x, layerBounds.y + layerBounds.height / 2)}
      </div>

      {/* Rotation handle */}
      {(showRotateHandle || isDragging) && (
        <div className="pointer-events-auto">
          {/* Rotation line */}
          <div
            className="absolute w-0.5 bg-blue-500"
            style={{
              left: layerBounds.x + layerBounds.width / 2,
              top: layerBounds.y - 30,
              height: 25
            }}
          />
          
          {/* Rotation handle */}
          <div
            className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-lg hover:bg-blue-50 cursor-grab"
            style={{
              left: layerBounds.x + layerBounds.width / 2 - 8,
              top: layerBounds.y - 38
            }}
            onMouseDown={(e) => handleMouseDown(e, 'rotate')}
          />
        </div>
      )}

      {/* Layer info tooltip */}
      {isDragging && (
        <div
          className="absolute bg-black bg-opacity-90 text-white text-xs px-2 py-1 rounded pointer-events-none"
          style={{
            left: layerBounds.x,
            top: layerBounds.y - 30
          }}
        >
          {dragHandle === 'move' && (
            <span>x: {Math.round(layer.x)}, y: {Math.round(layer.y)}</span>
          )}
          {(dragHandle?.includes('w') || dragHandle?.includes('e') || dragHandle?.includes('n') || dragHandle?.includes('s')) && (
            <span>{Math.round(layer.width)} × {Math.round(layer.height)}</span>
          )}
          {dragHandle === 'rotate' && (
            <span>{Math.round(layer.rotation)}°</span>
          )}
        </div>
      )}
    </div>
  );
}