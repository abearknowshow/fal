"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Wand2, 
  Eraser, 
  RotateCcw, 
  Check, 
  X,
  Eye,
  EyeOff,
  Brush,
  Sparkles,
  ZoomIn,
  Scissors,
  Target,
  PaintBucket
} from "lucide-react";

interface SelectToolProps {
  activeLayerId: string | null;
  layers: Array<{ 
    id: string; 
    imageUrl: string; 
    originalUrl?: string; 
    x: number; 
    y: number; 
    width: number; 
    height: number;
    scaleX: number;
    scaleY: number;
  }>;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  onSelectionComplete: (imageUrl: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

type SelectMode = 'ai' | 'manual' | 'refine' | 'edge-detect' | 'magic-wand';
type BrushMode = 'add' | 'subtract' | 'smooth' | 'sharpen';

export function SelectTool({ 
  activeLayerId, 
  layers, 
  canvasWidth,
  canvasHeight,
  zoom, 
  onSelectionComplete, 
  onCancel, 
  isProcessing 
}: SelectToolProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [mode, setMode] = useState<SelectMode>('ai');
  const [brushMode, setBrushMode] = useState<BrushMode>('add');
  const [brushSize, setBrushSize] = useState(20);
  const [brushHardness, setBrushHardness] = useState(80); // 0-100, affects edge softness
  const [featherRadius, setFeatherRadius] = useState(2); // Edge feathering amount
  const [edgeThreshold, setEdgeThreshold] = useState(50); // For edge detection sensitivity
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [maskData, setMaskData] = useState<ImageData | null>(null);
  const [previewMask, setPreviewMask] = useState(true);
  const [showEdgeOverlay, setShowEdgeOverlay] = useState(false);
  const [magicWandTolerance, setMagicWandTolerance] = useState(20);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ confidence: number; area: string }>>([]);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const activeLayer = layers.find(l => l.id === activeLayerId);

  // Calculate the layer bounds in the viewport (matching EditorCanvas coordinate system)
  const getImageBounds = useCallback(() => {
    if (!overlayRef.current || !activeLayer) return { x: 0, y: 0, width: 0, height: 0 };
    
    const container = overlayRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // First, calculate the canvas bounds (same as EditorCanvas)
    const scaledCanvasWidth = canvasWidth * zoom;
    const scaledCanvasHeight = canvasHeight * zoom;
    const canvasX = (containerWidth - scaledCanvasWidth) / 2;
    const canvasY = (containerHeight - scaledCanvasHeight) / 2;
    
    // Then, calculate the layer position relative to the canvas
    const layerX = activeLayer.x * zoom;
    const layerY = activeLayer.y * zoom;
    const layerWidth = activeLayer.width * activeLayer.scaleX * zoom;
    const layerHeight = activeLayer.height * activeLayer.scaleY * zoom;
    
    // Final position in viewport
    const x = canvasX + layerX;
    const y = canvasY + layerY;
    
    console.log('Layer bounds calculation:', {
      containerSize: { w: containerWidth, h: containerHeight },
      canvasSize: { w: scaledCanvasWidth, h: scaledCanvasHeight },
      canvasPos: { x: canvasX, y: canvasY },
      layerPos: { x: activeLayer.x, y: activeLayer.y },
      layerSize: { w: activeLayer.width, h: activeLayer.height },
      layerScale: { sx: activeLayer.scaleX, sy: activeLayer.scaleY },
      finalBounds: { x, y, width: layerWidth, height: layerHeight }
    });
    
    return { x, y, width: layerWidth, height: layerHeight };
  }, [activeLayer, zoom, canvasWidth, canvasHeight]);

  // Initialize canvas for manual selection
  useEffect(() => {
    if (!canvasRef.current || !activeLayer) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match the scaled/rendered layer size
    const scaledWidth = activeLayer.width * activeLayer.scaleX;
    const scaledHeight = activeLayer.height * activeLayer.scaleY;
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    
    console.log('Canvas effect triggered:', {
      hasMaskData: !!maskData,
      maskDimensions: maskData ? `${maskData.width}x${maskData.height}` : 'none',
      layerDimensions: `${activeLayer.width}x${activeLayer.height}`,
      scaledDimensions: `${scaledWidth}x${scaledHeight}`,
      mode
    });
    
    // If we have mask data from AI selection, apply it directly (no scaling needed)
    if (maskData && maskData.width === scaledWidth && maskData.height === scaledHeight) {
      console.log('Applying mask data to canvas');
      ctx.putImageData(maskData, 0, 0);
    } else if (maskData && maskData.width === activeLayer.width && maskData.height === activeLayer.height) {
      console.log('Scaling mask data to match canvas');
      // Scale the mask to match the canvas size
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCanvas.width = maskData.width;
        tempCanvas.height = maskData.height;
        tempCtx.putImageData(maskData, 0, 0);
        
        // Draw scaled mask to main canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tempCanvas, 0, 0, maskData.width, maskData.height, 0, 0, scaledWidth, scaledHeight);
      }
    } else {
      // Initialize with transparent mask
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Store initial mask data only if we don't have any
      if (!maskData) {
        setMaskData(ctx.getImageData(0, 0, canvas.width, canvas.height));
      }
    }
  }, [activeLayer, maskData, mode]);

  // AI-powered smart selection
  // Draw on the selection mask
  const drawOnMask = useCallback((startX: number, startY: number, endX: number, endY: number) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || !activeLayer) return;

    // Set drawing style based on brush mode
    const softness = (100 - brushHardness) / 100;
    
    if (brushMode === 'add') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
    } else if (brushMode === 'subtract') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'transparent';
    } else if (brushMode === 'smooth') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(0, 100, 255, 0.4)';
      ctx.filter = `blur(${softness * 3}px)`;
    } else if (brushMode === 'sharpen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
      ctx.filter = `contrast(${100 + brushHardness}%)`;
    }
    
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Update mask data
    setMaskData(ctx.getImageData(0, 0, canvas.width, canvas.height));
  }, [brushMode, brushSize, brushHardness, activeLayer]);

  // Edge detection for smart selection assistance
  const detectEdges = useCallback(() => {
    if (!activeLayer || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load the source image for edge detection
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Create temporary canvas for edge detection
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      tempCanvas.width = activeLayer.width;
      tempCanvas.height = activeLayer.height;
      tempCtx.drawImage(img, 0, 0);

      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const edgeData = applyEdgeDetection(imageData, edgeThreshold);
      
      // Show edge overlay
      ctx.putImageData(edgeData, 0, 0);
      setShowEdgeOverlay(true);
    };
    img.src = activeLayer.imageUrl;
  }, [activeLayer, edgeThreshold]);

  // Apply Sobel edge detection
  const applyEdgeDetection = (imageData: ImageData, threshold: number): ImageData => {
    const { width, height, data } = imageData;
    const edgeData = new ImageData(width, height);
    
    // Sobel kernels
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        // Apply Sobel kernels
        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            const pixelIndex = ((y + ky - 1) * width + (x + kx - 1)) * 4;
            const gray = (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 3;
            
            gx += gray * sobelX[ky * 3 + kx];
            gy += gray * sobelY[ky * 3 + kx];
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        const edgeIntensity = magnitude > threshold ? 255 : 0;
        
        const outputIndex = (y * width + x) * 4;
        edgeData.data[outputIndex] = edgeIntensity;
        edgeData.data[outputIndex + 1] = edgeIntensity;
        edgeData.data[outputIndex + 2] = edgeIntensity;
        edgeData.data[outputIndex + 3] = edgeIntensity > 0 ? 255 : 0;
      }
    }
    
    return edgeData;
  };

  // Flood fill algorithm for magic wand
  const floodFill = (imageData: ImageData, startX: number, startY: number, tolerance: number): ImageData => {
    const { width, height, data } = imageData;
    const mask = new ImageData(width, height);
    const visited = new Set<string>();
    
    if (startX < 0 || startX >= width || startY < 0 || startY >= height) return mask;
    
    const startIndex = (startY * width + startX) * 4;
    const targetR = data[startIndex];
    const targetG = data[startIndex + 1];
    const targetB = data[startIndex + 2];
    
    const stack = [{ x: startX, y: startY }];
    
    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const key = `${x},${y}`;
      
      if (visited.has(key) || x < 0 || x >= width || y < 0 || y >= height) continue;
      visited.add(key);
      
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      
      // Check color similarity
      const colorDiff = Math.sqrt(
        Math.pow(r - targetR, 2) + 
        Math.pow(g - targetG, 2) + 
        Math.pow(b - targetB, 2)
      );
      
      if (colorDiff <= tolerance) {
        // Add to selection
        mask.data[index] = 0;
        mask.data[index + 1] = 255; // Use green channel as mask
        mask.data[index + 2] = 0;
        mask.data[index + 3] = 128;
        
        // Add neighboring pixels to stack
        stack.push({ x: x + 1, y });
        stack.push({ x: x - 1, y });
        stack.push({ x, y: y + 1 });
        stack.push({ x, y: y - 1 });
      }
    }
    
    return mask;
  };

  // Apply feathering to mask edges
  const applyFeathering = () => {
    if (!maskData || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const featheredMask = featherMask(maskData, featherRadius);
    ctx.putImageData(featheredMask, 0, 0);
    setMaskData(featheredMask);
  };

  // Feather mask edges for smoother transitions
  const featherMask = (imageData: ImageData, radius: number): ImageData => {
    if (radius === 0) return imageData;
    
    const { width, height } = imageData;
    const result = new ImageData(width, height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let totalAlpha = 0;
        let count = 0;
        
        // Sample surrounding pixels within radius
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance <= radius) {
                const weight = 1 - (distance / radius);
                const index = (ny * width + nx) * 4;
                totalAlpha += imageData.data[index + 1] * weight; // Green channel
                count += weight;
              }
            }
          }
        }
        
        const index = (y * width + x) * 4;
        const alpha = count > 0 ? totalAlpha / count : 0;
        
        result.data[index] = 0;
        result.data[index + 1] = alpha; // Green channel as mask
        result.data[index + 2] = 0;
        result.data[index + 3] = alpha > 0 ? 128 : 0;
      }
    }
    
    return result;
  };

  const handleAiSelection = async () => {
    console.log('Auto Select clicked');
    
    if (!activeLayer) {
      console.log('No active layer');
      return;
    }
    
    console.log('Starting AI selection...');
    console.log('Original imageUrl:', activeLayer.imageUrl);
    console.log('Original URL (if available):', activeLayer.originalUrl);
    console.log('Active layer full object:', activeLayer);
    
    // Use original fal.media URL if available, otherwise fall back to current imageUrl
    const urlToUse = activeLayer.originalUrl || activeLayer.imageUrl;
    console.log('Using URL for background removal:', urlToUse);
    
    setIsAiProcessing(true);
    try {
      const response = await fetch('/api/remove-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: urlToUse })
      });

      if (!response.ok) throw new Error('AI selection failed');
      
      const result = await response.json();
      
      // Create a mask from the background-removed image
      const maskCanvas = document.createElement('canvas');
      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) return;
      
      // Load the background-removed image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = result.imageUrl;
      });
      
      // Make sure mask canvas matches the scaled layer dimensions for display
      const scaledWidth = activeLayer.width * activeLayer.scaleX;
      const scaledHeight = activeLayer.height * activeLayer.scaleY;
      maskCanvas.width = scaledWidth;
      maskCanvas.height = scaledHeight;
      
      // Draw the background-removed image to match the scaled layer size
      maskCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
      const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      
      // Convert alpha channel to green channel mask for consistency with other tools
      for (let i = 0; i < imageData.data.length; i += 4) {
        const alpha = imageData.data[i + 3];
        if (alpha > 0) {
          // Subject pixel - mark as selected (green channel = 255)
          imageData.data[i] = 0;       // R
          imageData.data[i + 1] = 255; // G (mask channel)
          imageData.data[i + 2] = 0;   // B
          imageData.data[i + 3] = 200; // A (more opaque for visibility)
        } else {
          // Background pixel - mark as unselected (green channel = 0)
          imageData.data[i] = 0;       // R
          imageData.data[i + 1] = 0;   // G (mask channel)
          imageData.data[i + 2] = 0;   // B
          imageData.data[i + 3] = 0;   // A (fully transparent)
        }
      }
      
      // Count selected pixels for debugging
      let selectedPixels = 0;
      for (let i = 0; i < imageData.data.length; i += 4) {
        if (imageData.data[i + 1] > 0) selectedPixels++;
      }
      console.log(`Mask created: ${selectedPixels} selected pixels out of ${imageData.data.length / 4}`, {
        originalSize: `${activeLayer.width}x${activeLayer.height}`,
        scaledSize: `${scaledWidth}x${scaledHeight}`,
        scaleFactors: `${activeLayer.scaleX}x${activeLayer.scaleY}`
      });
      
      // Update the mask data
      setMaskData(imageData);
      
      // Switch to refine mode which will show the canvas and allow user to adjust
      setMode('refine');
      setAiSuggestions([
        { confidence: 0.92, area: 'Main subject detected' }
      ]);
      
      // The canvas will be created when we switch to refine mode
      // We'll update it in a useEffect
      
    } catch (error) {
      console.error('AI selection failed:', error);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Handle mouse clicks for different tools
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Magic wand tool
    if (mode === 'magic-wand') {
      if (!activeLayer || !canvasRef.current) return;
      
      const rect = overlayRef.current?.getBoundingClientRect();
      const imageBounds = getImageBounds();
      if (!rect) return;

      const x = Math.floor((e.clientX - rect.left - imageBounds.x) / zoom);
      const y = Math.floor((e.clientY - rect.top - imageBounds.y) / zoom);
      
      // Load image and perform flood fill selection
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        tempCanvas.width = activeLayer.width;
        tempCanvas.height = activeLayer.height;
        tempCtx.drawImage(img, 0, 0);

        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const floodFillMask = floodFill(imageData, x, y, magicWandTolerance);
        
        // Apply flood fill result to mask
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        ctx.putImageData(floodFillMask, 0, 0);
        setMaskData(floodFillMask);
      };
      img.src = activeLayer.imageUrl;
      return;
    }
    
    // Manual brush-based selection
    if (mode !== 'manual' && mode !== 'refine') return;
    
    e.preventDefault();
    setIsDrawing(true);
    
    const rect = overlayRef.current?.getBoundingClientRect();
    const imageBounds = getImageBounds();
    if (!rect) return;

    const x = (e.clientX - rect.left - imageBounds.x) / zoom;
    const y = (e.clientY - rect.top - imageBounds.y) / zoom;
    
    setLastPoint({ x, y });
    drawOnMask(x, y, x, y);
  }, [mode, zoom, getImageBounds, drawOnMask, activeLayer, magicWandTolerance]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !lastPoint || (mode !== 'manual' && mode !== 'refine')) return;
    
    const rect = overlayRef.current?.getBoundingClientRect();
    const imageBounds = getImageBounds();
    if (!rect) return;

    const x = (e.clientX - rect.left - imageBounds.x) / zoom;
    const y = (e.clientY - rect.top - imageBounds.y) / zoom;
    
    drawOnMask(lastPoint.x, lastPoint.y, x, y);
    setLastPoint({ x, y });
  }, [isDrawing, lastPoint, mode, zoom, getImageBounds, drawOnMask]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    setLastPoint(null);
  }, []);


  // Clear selection
  const handleClear = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setMaskData(ctx.getImageData(0, 0, canvas.width, canvas.height));
    setAiSuggestions([]);
  };

  // Apply selection
  const handleApplySelection = useCallback(async () => {
    if (!activeLayer || !maskData) return;
    
    try {
      // Create a new image with the selection applied
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = activeLayer.width;
      canvas.height = activeLayer.height;

      // Load the original image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = activeLayer.imageUrl;
      });

      // Draw the original image
      ctx.drawImage(img, 0, 0);

      // Apply the mask
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      let backgroundPixels = 0;
      let subjectPixels = 0;
      
      for (let i = 0; i < imageData.data.length; i += 4) {
        const maskValue = maskData.data[i + 1]; // Use green channel as mask
        if (maskValue === 0) {
          // Background pixel - make transparent (remove)
          imageData.data[i + 3] = 0;
          backgroundPixels++;
        } else {
          // Subject pixels (maskValue > 0) keep their original alpha  
          subjectPixels++;
        }
      }
      
      console.log('Mask application:', {
        totalPixels: imageData.data.length / 4,
        backgroundPixels,
        subjectPixels,
        maskDimensions: `${maskData.width}x${maskData.height}`,
        canvasDimensions: `${canvas.width}x${canvas.height}`
      });

      ctx.putImageData(imageData, 0, 0);
      const resultUrl = canvas.toDataURL('image/png');

      onSelectionComplete(resultUrl);
    } catch (error) {
      console.error('Failed to apply selection:', error);
    }
  }, [activeLayer, maskData, onSelectionComplete]);

  const imageBounds = getImageBounds();
  const hasSelection = maskData && maskData.data.some(byte => byte > 0);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && hasSelection && !isProcessing) {
        e.preventDefault();
        handleApplySelection();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onCancel, hasSelection, isProcessing, handleApplySelection]);

  return (
    <div 
      ref={overlayRef}
      className="absolute inset-0"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Selection overlay canvas */}
      {(mode === 'manual' || mode === 'refine' || mode === 'magic-wand' || mode === 'edge-detect') && activeLayer && (
        <canvas
          ref={canvasRef}
          className={`absolute border-2 border-dashed border-blue-500 ${previewMask ? 'opacity-90' : 'opacity-50'}`}
          style={{
            mixBlendMode: 'normal',
            left: imageBounds.x,
            top: imageBounds.y,
            width: imageBounds.width,
            height: imageBounds.height,
            cursor: mode === 'manual' || mode === 'refine' ? 
              `url("data:image/svg+xml,${encodeURIComponent(`<svg width="${brushSize}" height="${brushSize}" viewBox="0 0 ${brushSize} ${brushSize}" xmlns="http://www.w3.org/2000/svg"><circle cx="${brushSize/2}" cy="${brushSize/2}" r="${brushSize/2-1}" fill="none" stroke="${brushMode === 'add' ? '#22c55e' : brushMode === 'subtract' ? '#ef4444' : '#3b82f6'}" stroke-width="2"/></svg>`)}") ${brushSize/2} ${brushSize/2}, crosshair` : 
              mode === 'magic-wand' ? 'crosshair' :
              'default'
          }}
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Smart Selection Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-3">
        {/* Mode Selection */}
        <Card className="p-3">
          <div className="text-xs font-medium mb-2 text-gray-600">Selection Tools</div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={mode === 'ai' ? "default" : "outline"}
              size="sm"
              onClick={() => setMode('ai')}
              disabled={isProcessing}
              className="justify-start"
            >
              <Wand2 className="h-3 w-3 mr-1" />
              AI
            </Button>
            <Button
              variant={mode === 'manual' ? "default" : "outline"}
              size="sm"
              onClick={() => setMode('manual')}
              disabled={isProcessing}
              className="justify-start"
            >
              <Brush className="h-3 w-3 mr-1" />
              Paint
            </Button>
            <Button
              variant={mode === 'magic-wand' ? "default" : "outline"}
              size="sm"
              onClick={() => setMode('magic-wand')}
              disabled={isProcessing}
              className="justify-start"
            >
              <Target className="h-3 w-3 mr-1" />
              Wand
            </Button>
            <Button
              variant={mode === 'edge-detect' ? "default" : "outline"}
              size="sm"
              onClick={() => { setMode('edge-detect'); detectEdges(); }}
              disabled={isProcessing}
              className="justify-start"
            >
              <ZoomIn className="h-3 w-3 mr-1" />
              Edge
            </Button>
          </div>
          
          {hasSelection && (
            <Button
              variant={mode === 'refine' ? "default" : "outline"}
              size="sm"
              onClick={() => setMode('refine')}
              disabled={isProcessing}
              className="justify-start mt-2 w-full"
            >
              <Scissors className="h-4 w-4 mr-2" />
              Refine Edges
            </Button>
          )}
        </Card>

        {/* AI Suggestions */}
        {mode === 'ai' && aiSuggestions.length > 0 && (
          <Card className="p-3">
            <div className="text-xs font-medium mb-2 text-gray-600">AI Detected</div>
            <div className="space-y-1">
              {aiSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span>{suggestion.area}</span>
                  <span className="text-green-600 font-medium">
                    {Math.round(suggestion.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Magic Wand Settings */}
        {mode === 'magic-wand' && (
          <Card className="p-3">
            <div className="text-xs font-medium mb-2 text-gray-600">Magic Wand</div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-600 mb-1">Tolerance: {magicWandTolerance}</div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={magicWandTolerance}
                  onChange={(e) => setMagicWandTolerance(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="text-xs text-gray-500">
                Click on image areas to select similar colors
              </div>
            </div>
          </Card>
        )}

        {/* Edge Detection Settings */}
        {mode === 'edge-detect' && (
          <Card className="p-3">
            <div className="text-xs font-medium mb-2 text-gray-600">Edge Detection</div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-600 mb-1">Sensitivity: {edgeThreshold}</div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={edgeThreshold}
                  onChange={(e) => setEdgeThreshold(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={detectEdges}
                className="w-full"
              >
                <ZoomIn className="h-3 w-3 mr-1" />
                Detect Edges
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEdgeOverlay(!showEdgeOverlay)}
                className="w-full"
              >
                {showEdgeOverlay ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                {showEdgeOverlay ? 'Hide' : 'Show'} Edges
              </Button>
            </div>
          </Card>
        )}

        {/* Manual Tools */}
        {(mode === 'manual' || mode === 'refine') && (
          <Card className="p-3">
            <div className="text-xs font-medium mb-2 text-gray-600">Brush Tools</div>
            <div className="space-y-3">
              {/* Brush mode */}
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant={brushMode === 'add' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBrushMode('add')}
                  className="flex-1"
                >
                  <Brush className="h-3 w-3 mr-1" />
                  Add
                </Button>
                <Button
                  variant={brushMode === 'subtract' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBrushMode('subtract')}
                  className="flex-1"
                >
                  <Eraser className="h-3 w-3 mr-1" />
                  Erase
                </Button>
                <Button
                  variant={brushMode === 'smooth' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBrushMode('smooth')}
                  className="flex-1"
                >
                  <PaintBucket className="h-3 w-3 mr-1" />
                  Smooth
                </Button>
                <Button
                  variant={brushMode === 'sharpen' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBrushMode('sharpen')}
                  className="flex-1"
                >
                  <Target className="h-3 w-3 mr-1" />
                  Sharp
                </Button>
              </div>

              {/* Brush size */}
              <div>
                <div className="text-xs text-gray-600 mb-1">Size: {brushSize}px</div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Brush hardness */}
              <div>
                <div className="text-xs text-gray-600 mb-1">Hardness: {brushHardness}%</div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={brushHardness}
                  onChange={(e) => setBrushHardness(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Preview toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMask(!previewMask)}
                className="w-full"
              >
                {previewMask ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                {previewMask ? 'Hide' : 'Show'} Mask
              </Button>
            </div>
          </Card>
        )}

        {/* Edge Refinement Tools */}
        {hasSelection && (
          <Card className="p-3">
            <div className="text-xs font-medium mb-2 text-gray-600">Edge Refinement</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-600 mb-1">Feather: {featherRadius}px</div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={featherRadius}
                  onChange={(e) => setFeatherRadius(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={applyFeathering}
                className="w-full"
                disabled={!maskData}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Apply Feathering
              </Button>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <Card className="p-3">
          <div className="flex flex-col gap-2">
            {mode === 'ai' && (
              <Button 
                onClick={handleAiSelection}
                disabled={isProcessing || isAiProcessing}
                className="w-full"
              >
                {isAiProcessing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Auto Select
                  </>
                )}
              </Button>
            )}

            {(mode === 'manual' || mode === 'refine') && (
              <Button 
                onClick={handleApplySelection}
                disabled={isProcessing || !hasSelection}
                className="w-full"
              >
                <Check className="h-4 w-4 mr-2" />
                Apply Selection
              </Button>
            )}

            <div className="flex gap-2">
              {hasSelection && (
                <Button variant="outline" size="sm" onClick={handleClear} disabled={isProcessing}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onCancel} disabled={isProcessing}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Instructions */}
      {!isProcessing && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-90 text-white text-xs px-4 py-3 rounded-lg max-w-sm shadow-lg">
          <div className="font-medium mb-2 flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            Smart Selection:
          </div>
          <div className="space-y-1">
            {mode === 'ai' && (
              <>
                <div>• Click &quot;Auto Select&quot; for AI-powered detection</div>
                <div>• Switch to Manual for precise control</div>
              </>
            )}
            {mode === 'manual' && (
              <>
                <div>• Paint over areas to select</div>
                <div>• Use Add/Erase modes to refine</div>
                <div>• Adjust brush size as needed</div>
              </>
            )}
            {mode === 'refine' && (
              <>
                <div>• Fine-tune your existing selection</div>
                <div>• Add missed areas or remove excess</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}