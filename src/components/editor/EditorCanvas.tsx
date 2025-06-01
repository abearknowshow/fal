"use client";

import { forwardRef, useRef, useState } from "react";
import { EditorState, EditorLayer } from "@/types/image-editor";
import { TransformTool } from "./TransformTool";

interface EditorCanvasProps {
  editorState: EditorState;
  onLayerUpdate: (layerId: string, updates: Partial<EditorLayer>) => void;
  onStateUpdate: (updates: Partial<EditorState>) => void;
}

export const EditorCanvas = forwardRef<HTMLCanvasElement, EditorCanvasProps>(
  function EditorCanvas({ editorState, onLayerUpdate, onStateUpdate }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [dragLayerId, setDragLayerId] = useState<string | null>(null);

    // Calculate the image bounds in the viewport
    const getImageBounds = () => {
      if (!containerRef.current) return { x: 0, y: 0, width: 0, height: 0 };
      
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      const imageWidth = editorState.canvasWidth * editorState.zoom;
      const imageHeight = editorState.canvasHeight * editorState.zoom;
      
      // Center the image in the viewport
      const x = (containerWidth - imageWidth) / 2;
      const y = (containerHeight - imageHeight) / 2;
      
      return { x, y, width: imageWidth, height: imageHeight };
    };

    // Handle mouse events for layer manipulation
    const handleMouseDown = (e: React.MouseEvent) => {
      if (!editorState.activeLayerId) return;
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const imageBounds = getImageBounds();
      const x = (e.clientX - rect.left - imageBounds.x) / editorState.zoom;
      const y = (e.clientY - rect.top - imageBounds.y) / editorState.zoom;

      // Check if click is on active layer
      const activeLayer = editorState.layers.find(l => l.id === editorState.activeLayerId);
      if (!activeLayer) return;

      // Account for layer scaling in hit detection
      const layerWidth = activeLayer.width * activeLayer.scaleX;
      const layerHeight = activeLayer.height * activeLayer.scaleY;
      
      if (
        x >= activeLayer.x && 
        x <= activeLayer.x + layerWidth &&
        y >= activeLayer.y && 
        y <= activeLayer.y + layerHeight
      ) {
        setIsDragging(true);
        setDragStart({ x: x - activeLayer.x, y: y - activeLayer.y });
        setDragLayerId(activeLayer.id);
      }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || !dragLayerId) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const imageBounds = getImageBounds();
      const x = (e.clientX - rect.left - imageBounds.x) / editorState.zoom;
      const y = (e.clientY - rect.top - imageBounds.y) / editorState.zoom;

      // Constrain layer movement to image bounds (account for scaling)
      const layer = editorState.layers.find(l => l.id === dragLayerId);
      if (!layer) return;

      const layerWidth = layer.width * layer.scaleX;
      const layerHeight = layer.height * layer.scaleY;

      const newX = Math.max(0, Math.min(editorState.canvasWidth - layerWidth, x - dragStart.x));
      const newY = Math.max(0, Math.min(editorState.canvasHeight - layerHeight, y - dragStart.y));

      onLayerUpdate(dragLayerId, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragLayerId(null);
    };

    // Handle zoom
    const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, editorState.zoom * delta));
      onStateUpdate({ zoom: newZoom });
    };

    const imageBounds = getImageBounds();

    return (
      <div 
        ref={containerRef}
        className="w-full h-full relative overflow-hidden bg-background"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Canvas for final rendering */}
        <canvas
          ref={ref}
          className="absolute top-0 left-0 pointer-events-none"
          style={{ display: 'none' }}
        />
        
        {/* Image editing area - no white frame */}
        <div 
          className="absolute"
          style={{
            left: imageBounds.x,
            top: imageBounds.y,
            width: imageBounds.width,
            height: imageBounds.height,
          }}
        >
          {/* Render layers */}
          {editorState.layers.map((layer) => {
            const baseStyle = {
              left: layer.x * editorState.zoom,
              top: layer.y * editorState.zoom,
              width: layer.width * editorState.zoom,
              height: layer.height * editorState.zoom,
              opacity: layer.visible ? layer.opacity : 0,
            };

            // Apply perspective transform if available
            if (layer.perspectiveTransform) {
              const { topLeft, topRight, bottomLeft, bottomRight } = layer.perspectiveTransform;
              const clipPath = `polygon(${topLeft.x * editorState.zoom}px ${topLeft.y * editorState.zoom}px, ${topRight.x * editorState.zoom}px ${topRight.y * editorState.zoom}px, ${bottomRight.x * editorState.zoom}px ${bottomRight.y * editorState.zoom}px, ${bottomLeft.x * editorState.zoom}px ${bottomLeft.y * editorState.zoom}px)`;
              
              return (
                <div
                  key={layer.id}
                  className={`absolute ${
                    layer.id === editorState.activeLayerId ? '' : 'cursor-pointer'
                  }`}
                  style={{
                    ...baseStyle,
                    clipPath,
                    transform: `scale(${layer.scaleX}, ${layer.scaleY}) rotate(${layer.rotation}deg)`,
                    transformOrigin: 'center'
                  }}
                  onClick={() => onStateUpdate({ activeLayerId: layer.id })}
                >
                  <img
                    src={layer.imageUrl}
                    alt={layer.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                    loading="eager"
                  />
                </div>
              );
            }

            // Standard rendering for layers without perspective transform
            return (
              <div
                key={layer.id}
                className={`absolute ${
                  layer.id === editorState.activeLayerId ? (layer.isBackground ? '' : 'cursor-move') : 'cursor-pointer'
                } ${!layer.isBackground ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                style={{
                  ...baseStyle,
                  transform: `scale(${layer.scaleX}, ${layer.scaleY}) rotate(${layer.rotation}deg)`,
                  transformOrigin: 'center'
                }}
                onClick={() => onStateUpdate({ activeLayerId: layer.id })}
              >
                <img
                  src={layer.imageUrl}
                  alt={layer.name}
                  className="w-full h-full object-cover"
                  draggable={false}
                  loading="eager"
                />
              </div>
            );
          })}
          
          {/* Transform handles for active layer */}
          {editorState.activeLayerId && editorState.currentTool === 'select' && (() => {
            const activeLayer = editorState.layers.find(l => l.id === editorState.activeLayerId);
            return activeLayer ? (
              <TransformTool
                layer={activeLayer}
                zoom={editorState.zoom}
                canvasWidth={editorState.canvasWidth}
                canvasHeight={editorState.canvasHeight}
                onLayerUpdate={onLayerUpdate}
                getImageBounds={getImageBounds}
              />
            ) : null;
          })()}
          
          {/* Subtle grid overlay only on the image area */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
              `,
              backgroundSize: `${20 * editorState.zoom}px ${20 * editorState.zoom}px`
            }}
          />
        </div>
        
        {/* Zoom indicator */}
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded text-sm">
          {Math.round(editorState.zoom * 100)}%
        </div>
      </div>
    );
  }
); 