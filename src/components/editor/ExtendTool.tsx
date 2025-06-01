"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Clock, Zap, Sparkles, RotateCcw } from "lucide-react";
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

  // Initialize extend area to show the original image bounds with some extension
  const [extendArea, setExtendArea] = useState<ExtendArea>(() => {
    const extensionAmount = 100; // Increased default extension amount
    return {
      x: -extensionAmount,
      y: -extensionAmount,
      width: canvasWidth + (extensionAmount * 2),
      height: canvasHeight + (extensionAmount * 2),
      originalX: 0,
      originalY: 0,
      originalWidth: canvasWidth,
      originalHeight: canvasHeight
    };
  });

  // Update extend area when component mounts and when zoom or canvas size changes
  useEffect(() => {
    const bounds = getImageBounds();
    setExtendArea(prev => {
      // Preserve any user modifications to the extend area
      const currentExtensionX = (prev.width - prev.originalWidth) / 2;
      const currentExtensionY = (prev.height - prev.originalHeight) / 2;
      
      return {
        x: bounds.x - currentExtensionX,
        y: bounds.y - currentExtensionY,
        width: bounds.width + (currentExtensionX * 2),
        height: bounds.height + (currentExtensionY * 2),
        originalX: bounds.x,
        originalY: bounds.y,
        originalWidth: bounds.width,
        originalHeight: bounds.height
      };
    });
  }, [getImageBounds, zoom]);
  
  const [prompt, setPrompt] = useState('');
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number>(15);
  const [selectedDirection, setSelectedDirection] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null);

  // Preset extension amounts (like Canva/Adobe Express)
  const extensionPresets = [
    { name: '25px', value: 25 },
    { name: '50px', value: 50 },
    { name: '100px', value: 100 },
    { name: '200px', value: 200 },
    { name: '300px', value: 300 }
  ];

  // Calculate extension amounts for display and API
  const getExtensionAmounts = useCallback(() => {
    const topExtension = Math.max(0, extendArea.originalY - extendArea.y);
    const bottomExtension = Math.max(0, (extendArea.y + extendArea.height) - (extendArea.originalY + extendArea.originalHeight));
    const leftExtension = Math.max(0, extendArea.originalX - extendArea.x);
    const rightExtension = Math.max(0, (extendArea.x + extendArea.width) - (extendArea.originalX + extendArea.originalWidth));
    
    return { topExtension, bottomExtension, leftExtension, rightExtension };
  }, [extendArea]);

  // Calculate estimated processing time based on extension area
  useEffect(() => {
    const { topExtension, bottomExtension, leftExtension, rightExtension } = getExtensionAmounts();
    const totalExtensionArea = (topExtension + bottomExtension) * extendArea.width + 
                              (leftExtension + rightExtension) * extendArea.height;
    
    // Base time: 10 seconds, +1 second per 10,000 pixels of extension
    const baseTime = 10;
    const additionalTime = Math.floor(totalExtensionArea / 10000);
    setEstimatedTime(Math.min(baseTime + additionalTime, 60)); // Cap at 60 seconds
  }, [extendArea, getExtensionAmounts]);

  // Track processing time
  useEffect(() => {
    if (isProcessing && !processingStartTime) {
      setProcessingStartTime(Date.now());
    } else if (!isProcessing && processingStartTime) {
      setProcessingStartTime(null);
    }
  }, [isProcessing, processingStartTime]);

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

    setExtendArea(prev => {
      const newArea = { ...prev };

      switch (dragHandle) {
        case 'move':
          // Move the entire extend area
          newArea.x = prev.x + deltaX;
          newArea.y = prev.y + deltaY;
          break;
        case 'n':
          // Extend top - only allow if this is the only direction being extended
          const currentTopExtension = prev.originalY - prev.y;
          const currentBottomExtension = (prev.y + prev.height) - (prev.originalY + prev.originalHeight);
          const currentLeftExtension = prev.originalX - prev.x;
          const currentRightExtension = (prev.x + prev.width) - (prev.originalX + prev.originalWidth);
          
          // Allow if no extensions exist, or only top is already extended
          if ((currentBottomExtension <= 0 && currentLeftExtension <= 0 && currentRightExtension <= 0) || 
              (currentTopExtension > 0 && currentBottomExtension <= 0 && currentLeftExtension <= 0 && currentRightExtension <= 0)) {
            const newTopY = Math.min(prev.y + deltaY, prev.originalY - 10);
            newArea.y = newTopY;
            newArea.height = prev.height - (newTopY - prev.y);
          }
          break;
        case 's':
          // Extend bottom - only allow if this is the only direction being extended
          const currentTopExtensionS = prev.originalY - prev.y;
          const currentBottomExtensionS = (prev.y + prev.height) - (prev.originalY + prev.originalHeight);
          const currentLeftExtensionS = prev.originalX - prev.x;
          const currentRightExtensionS = (prev.x + prev.width) - (prev.originalX + prev.originalWidth);
          
          // Allow if no extensions exist, or only bottom is already extended
          if ((currentTopExtensionS <= 0 && currentLeftExtensionS <= 0 && currentRightExtensionS <= 0) || 
              (currentBottomExtensionS > 0 && currentTopExtensionS <= 0 && currentLeftExtensionS <= 0 && currentRightExtensionS <= 0)) {
            const newBottomHeight = Math.max(prev.height + deltaY, prev.originalY + prev.originalHeight - prev.y + 10);
            newArea.height = newBottomHeight;
          }
          break;
        case 'w':
          // Extend left - only allow if this is the only direction being extended
          const currentTopExtensionW = prev.originalY - prev.y;
          const currentBottomExtensionW = (prev.y + prev.height) - (prev.originalY + prev.originalHeight);
          const currentLeftExtensionW = prev.originalX - prev.x;
          const currentRightExtensionW = (prev.x + prev.width) - (prev.originalX + prev.originalWidth);
          
          // Allow if no extensions exist, or only left is already extended
          if ((currentTopExtensionW <= 0 && currentBottomExtensionW <= 0 && currentRightExtensionW <= 0) || 
              (currentLeftExtensionW > 0 && currentTopExtensionW <= 0 && currentBottomExtensionW <= 0 && currentRightExtensionW <= 0)) {
            const newLeftX = Math.min(prev.x + deltaX, prev.originalX - 10);
            newArea.x = newLeftX;
            newArea.width = prev.width - (newLeftX - prev.x);
          }
          break;
        case 'e':
          // Extend right - only allow if this is the only direction being extended
          const currentTopExtensionE = prev.originalY - prev.y;
          const currentBottomExtensionE = (prev.y + prev.height) - (prev.originalY + prev.originalHeight);
          const currentLeftExtensionE = prev.originalX - prev.x;
          const currentRightExtensionE = (prev.x + prev.width) - (prev.originalX + prev.originalWidth);
          
          // Allow if no extensions exist, or only right is already extended
          if ((currentTopExtensionE <= 0 && currentBottomExtensionE <= 0 && currentLeftExtensionE <= 0) || 
              (currentRightExtensionE > 0 && currentTopExtensionE <= 0 && currentBottomExtensionE <= 0 && currentLeftExtensionE <= 0)) {
            const newRightWidth = Math.max(prev.width + deltaX, prev.originalX + prev.originalWidth - prev.x + 10);
            newArea.width = newRightWidth;
          }
          break;
        case 'nw':
        case 'ne':
        case 'sw':
        case 'se':
          // Disable corner handles to enforce single direction
          break;
      }

      // Ensure the extend area always contains the original image
      const minX = Math.min(newArea.x, prev.originalX);
      const minY = Math.min(newArea.y, prev.originalY);
      const maxX = Math.max(newArea.x + newArea.width, prev.originalX + prev.originalWidth);
      const maxY = Math.max(newArea.y + newArea.height, prev.originalY + prev.originalHeight);
      
      newArea.x = minX;
      newArea.y = minY;
      newArea.width = maxX - minX;
      newArea.height = maxY - minY;

      // Constrain to reasonable bounds (max 4x original size)
      const maxWidth = prev.originalWidth * 4;
      const maxHeight = prev.originalHeight * 4;
      if (newArea.width > maxWidth) {
        newArea.width = maxWidth;
      }
      if (newArea.height > maxHeight) {
        newArea.height = maxHeight;
      }

      return newArea;
    });

    setDragStart({ x, y });
  }, [isDragging, dragHandle, dragStart, zoom, getImageBounds]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragHandle(null);
  }, []);

  const handleExtend = () => {
    // Convert to the coordinate system expected by the API (original image at 0,0)
    const bounds = getImageBounds();
    const logicalExtendArea = {
      x: extendArea.x - bounds.x,
      y: extendArea.y - bounds.y,
      width: extendArea.width,
      height: extendArea.height,
      originalX: 0, // Original image is always at 0,0 in API coordinates
      originalY: 0,
      originalWidth: canvasWidth,
      originalHeight: canvasHeight
    };

    onExtend({
      extendArea: logicalExtendArea,
      prompt: prompt.trim() || undefined
    });
  };

  const handleReset = () => {
    const bounds = getImageBounds();
    setExtendArea({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      originalX: bounds.x,
      originalY: bounds.y,
      originalWidth: bounds.width,
      originalHeight: bounds.height
    });
    setSelectedDirection(null);
  };

  // Quick extend in specific direction with preset amount
  const handleQuickExtend = (direction: 'top' | 'bottom' | 'left' | 'right', amount: number) => {
    const bounds = getImageBounds();
    const newExtendArea = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      originalX: bounds.x,
      originalY: bounds.y,
      originalWidth: bounds.width,
      originalHeight: bounds.height
    };

    switch (direction) {
      case 'top':
        newExtendArea.y = bounds.y - amount * zoom;
        newExtendArea.height = bounds.height + amount * zoom;
        break;
      case 'bottom':
        newExtendArea.height = bounds.height + amount * zoom;
        break;
      case 'left':
        newExtendArea.x = bounds.x - amount * zoom;
        newExtendArea.width = bounds.width + amount * zoom;
        break;
      case 'right':
        newExtendArea.width = bounds.width + amount * zoom;
        break;
    }

    setExtendArea(newExtendArea);
    setSelectedDirection(direction);
  };

  // Check if extension is in one direction only
  const isValidExtension = () => {
    const { topExtension, bottomExtension, leftExtension, rightExtension } = getExtensionAmounts();
    const activeDirections = [
      topExtension > 0,
      bottomExtension > 0,
      leftExtension > 0,
      rightExtension > 0
    ].filter(Boolean).length;
    
    return activeDirections <= 1;
  };

  // Get the primary extension direction
  const getPrimaryDirection = () => {
    const { topExtension, bottomExtension, leftExtension, rightExtension } = getExtensionAmounts();
    
    if (topExtension > 0) return 'top';
    if (bottomExtension > 0) return 'bottom';
    if (leftExtension > 0) return 'left';
    if (rightExtension > 0) return 'right';
    
    return null;
  };

  const { topExtension, bottomExtension, leftExtension, rightExtension } = getExtensionAmounts();
  const hasExtension = topExtension > 0 || bottomExtension > 0 || leftExtension > 0 || rightExtension > 0;
  const validExtension = isValidExtension();
  const primaryDirection = getPrimaryDirection();

  // Calculate processing progress (estimated)
  const getProcessingProgress = () => {
    if (!processingStartTime) return 0;
    const elapsed = (Date.now() - processingStartTime) / 1000;
    return Math.min((elapsed / estimatedTime) * 100, 95); // Cap at 95% until completion
  };

  const processingProgress = getProcessingProgress();
  const imageBounds = getImageBounds();

  return (
    <div 
      ref={overlayRef}
      className="absolute inset-0 cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Overlay with extend area visualization */}
      <div className="absolute inset-0">
        {/* Extension areas - show what will be generated */}
        {topExtension > 0 && (
          <div 
            className="absolute bg-primary/20 border-2 border-primary border-dashed"
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
            className="absolute bg-primary/20 border-2 border-primary border-dashed"
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
            className="absolute bg-primary/20 border-2 border-primary border-dashed"
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
            className="absolute bg-primary/20 border-2 border-primary border-dashed"
            style={{
              left: imageBounds.x + (extendArea.originalX + extendArea.originalWidth) * zoom,
              top: imageBounds.y + extendArea.y * zoom,
              width: rightExtension * zoom,
              height: extendArea.height * zoom
            }}
          />
        )}

        {/* Original image area - highlighted */}
        <div
          className="absolute border-2 border-white border-solid bg-white bg-opacity-10"
          style={{
            left: imageBounds.x + extendArea.originalX * zoom,
            top: imageBounds.y + extendArea.originalY * zoom,
            width: extendArea.originalWidth * zoom,
            height: extendArea.originalHeight * zoom
          }}
        />
      </div>

      {/* Extend selection area with handles */}
      <div
        className="absolute border-2 border-primary border-solid cursor-move"
        style={{
          left: imageBounds.x + extendArea.x * zoom,
          top: imageBounds.y + extendArea.y * zoom,
          width: extendArea.width * zoom,
          height: extendArea.height * zoom
        }}
        onMouseDown={(e) => handleMouseDown(e)}
      >
        {/* Edge handles */}
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-3 bg-primary border border-white cursor-n-resize"
          onMouseDown={(e) => handleMouseDown(e, 'n')}
        />
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-3 bg-primary border border-white cursor-s-resize"
          onMouseDown={(e) => handleMouseDown(e, 's')}
        />
        <div
          className="absolute -left-1 top-1/2 -translate-y-1/2 w-3 h-6 bg-primary border border-white cursor-w-resize"
          onMouseDown={(e) => handleMouseDown(e, 'w')}
        />
        <div
          className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-6 bg-primary border border-white cursor-e-resize"
          onMouseDown={(e) => handleMouseDown(e, 'e')}
        />

        {/* Corner handles removed - only single direction extension allowed */}
        
        {/* Extension info */}
        <div className="absolute -top-20 left-0 bg-black bg-opacity-90 text-white text-xs px-4 py-3 rounded-lg max-w-xs shadow-lg">
          <div className="font-medium mb-2 flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            Extension Preview
          </div>
          {hasExtension ? (
            <div className="space-y-1">
              {primaryDirection && (
                <div className="text-primary font-medium">
                  Extending {primaryDirection}: +{Math.round(
                    primaryDirection === 'top' ? topExtension :
                    primaryDirection === 'bottom' ? bottomExtension :
                    primaryDirection === 'left' ? leftExtension :
                    rightExtension
                  )}px
                </div>
              )}
              {!validExtension && (
                <div className="text-red-300 text-xs">
                  ⚠ Only one direction allowed
                </div>
              )}
              <div className="pt-2 border-t border-gray-500 space-y-1">
                <div>New size: {Math.round(extendArea.width)} × {Math.round(extendArea.height)}</div>
                <div className="flex items-center gap-1 text-gray-300">
                  <Clock className="h-3 w-3" />
                  Est. {estimatedTime}s
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-300">Drag edge handles to extend in one direction</div>
          )}
        </div>
      </div>

      {/* Quick Extension Controls - Canva-style */}
      <div className="absolute top-4 right-4 flex flex-col gap-3">
        {/* Direction Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-3 border">
          <div className="text-xs font-medium mb-2 text-gray-600">Quick Extend</div>
          <div className="grid grid-cols-3 gap-1 w-24">
            {/* Top row */}
            <div></div>
            <Button
              variant={selectedDirection === 'top' ? "default" : "outline"}
              size="sm"
              onClick={() => selectedDirection === 'top' ? handleReset() : handleQuickExtend('top', 100)}
              disabled={isProcessing}
              className="h-6 w-6 p-0 text-xs"
              title="Extend Top"
            >
              ↑
            </Button>
            <div></div>
            
            {/* Middle row */}
            <Button
              variant={selectedDirection === 'left' ? "default" : "outline"}
              size="sm"
              onClick={() => selectedDirection === 'left' ? handleReset() : handleQuickExtend('left', 100)}
              disabled={isProcessing}
              className="h-6 w-6 p-0 text-xs"
              title="Extend Left"
            >
              ←
            </Button>
            <div className="h-6 w-6 bg-gray-100 rounded border-2 border-gray-300 flex items-center justify-center">
              <div className="h-2 w-2 bg-gray-400 rounded"></div>
            </div>
            <Button
              variant={selectedDirection === 'right' ? "default" : "outline"}
              size="sm"
              onClick={() => selectedDirection === 'right' ? handleReset() : handleQuickExtend('right', 100)}
              disabled={isProcessing}
              className="h-6 w-6 p-0 text-xs"
              title="Extend Right"
            >
              →
            </Button>
            
            {/* Bottom row */}
            <div></div>
            <Button
              variant={selectedDirection === 'bottom' ? "default" : "outline"}
              size="sm"
              onClick={() => selectedDirection === 'bottom' ? handleReset() : handleQuickExtend('bottom', 100)}
              disabled={isProcessing}
              className="h-6 w-6 p-0 text-xs"
              title="Extend Bottom"
            >
              ↓
            </Button>
            <div></div>
          </div>
        </div>

        {/* Extension Amount Presets */}
        {selectedDirection && (
          <div className="bg-white rounded-lg shadow-lg p-3 border">
            <div className="text-xs font-medium mb-2 text-gray-600">Amount</div>
            <div className="grid grid-cols-2 gap-1">
              {extensionPresets.map((preset) => (
                <Button
                  key={preset.value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickExtend(selectedDirection, preset.value)}
                  disabled={isProcessing}
                  className="h-6 text-xs"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleExtend} 
              disabled={isProcessing || !hasExtension || !validExtension}
              className="min-w-[120px]"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Extending...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>Extend</span>
                </div>
              )}
            </Button>
            {hasExtension && (
              <Button variant="outline" size="sm" onClick={handleReset} disabled={isProcessing} title="Reset Extension">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onCancel} disabled={isProcessing}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
          
          {/* Prompt toggle */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowPromptInput(!showPromptInput)}
            className="text-xs"
            disabled={isProcessing}
          >
            {showPromptInput ? 'Hide' : 'Add'} Prompt
          </Button>
        </div>
      </div>

      {/* Processing Progress Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Extending Image</h3>
              <p className="text-gray-600 mb-4">AI is generating new content for the extended areas...</p>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              
              <div className="flex justify-between text-sm text-gray-500">
                <span>{Math.round(processingProgress)}% complete</span>
                <span>~{Math.max(0, estimatedTime - Math.floor((Date.now() - (processingStartTime || 0)) / 1000))}s remaining</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prompt input panel */}
      {showPromptInput && !isProcessing && (
        <div className="absolute top-20 right-4 w-80 bg-white rounded-lg shadow-lg p-4 border">
          <label className="text-sm font-medium mb-2 block">
            Generation Prompt (Optional)
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what should be generated in the extended area..."
            className="min-h-[80px] text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">
            Leave empty to use the original image prompt
          </p>
        </div>
      )}

      {/* Instructions */}
      {!isProcessing && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-90 text-white text-xs px-4 py-3 rounded-lg max-w-sm shadow-lg">
          <div className="font-medium mb-2 flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            How to use:
          </div>
          <div className="space-y-1">
            <div>• Drag edge handles to extend in one direction only</div>
            <div>• Orange areas show what will be generated</div>
            <div>• White outline shows your original image</div>
            <div>• Use reset button to change direction</div>
            <div>• Add a prompt to guide the AI generation</div>
          </div>
        </div>
      )}
    </div>
  );
} 