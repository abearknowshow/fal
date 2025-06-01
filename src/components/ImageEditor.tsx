"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  X, 
  Download, 
  Undo, 
  Redo,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Play,
  Scissors
} from "lucide-react";
import { GalleryImage } from "@/types/image-generation";
import { 
  EditorState, 
  EditorLayer, 
  CropArea, 
  ExtendOptions,
  EDITOR_TOOLS,
  BackgroundRemovalResult,
  ImageExtensionResult,
  CanvasResizeOptions
} from "@/types/image-editor";
import { VideoGenerationParams, GeneratedVideo } from "@/types/video-generation";
import { EditorCanvas } from "./editor/EditorCanvas";
import { EditorToolbar } from "./editor/EditorToolbar";
import { LayerPanel } from "./editor/LayerPanel";
import { CropTool } from "./editor/CropTool";
import { ExtendTool } from "./editor/ExtendTool";
import { CanvasTool } from "./editor/CanvasTool";
import { SelectTool } from "./editor/SelectTool";
import { DropZone } from "./editor/DropZone";
import { AssetLibrary } from "./editor/AssetLibrary";
import { ExportModal } from "./editor/ExportModal";
import { PerspectiveTool } from "./editor/PerspectiveTool";
import { VideoGenerationForm } from "./VideoGenerationForm";
import { VideoProgressTracker } from "./VideoProgressTracker";
import { useVideoGeneration } from "@/hooks/useVideoGeneration";

interface ImageEditorProps {
  image: GalleryImage;
  onClose: () => void;
  onSave?: (editedImage: string) => void;
}

export default function ImageEditor({ image, onClose, onSave }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  // Drag and drop state
  const [isDragActive, setIsDragActive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Auto-remove background toggle
  const [autoRemoveBackground, setAutoRemoveBackground] = useState(true);
  
  // Panel state
  const [rightPanelMode, setRightPanelMode] = useState<'layers' | 'assets'>('layers');
  
  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Video generation state
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideoTask, setCurrentVideoTask] = useState<string | null>(null);
  
  // Video generation hook
  const {
    generateVideo,
    checkVideoStatus,
    isGenerating: isGeneratingVideo,
    addGeneratedVideo
  } = useVideoGeneration();
  
  // Calculate initial zoom to fit image in viewport
  const calculateFitZoom = useCallback(() => {
    if (!canvasContainerRef.current) {
      return 0.3; // Default reasonable zoom for large images
    }
    
    const container = canvasContainerRef.current;
    const containerWidth = Math.max(container.clientWidth - 64, 200); // Ensure minimum width
    const containerHeight = Math.max(container.clientHeight - 64, 200); // Ensure minimum height
    
    const scaleX = containerWidth / image.width;
    const scaleY = containerHeight / image.height;
    
    // Use the smaller scale to ensure the entire image fits
    const scale = Math.min(scaleX, scaleY, 1);
    return Math.max(scale, 0.1); // Ensure zoom is at least 0.1 (10%)
  }, [image.width, image.height]);
  
  const [editorState, setEditorState] = useState<EditorState>(() => {
    const initialLayer: EditorLayer = {
      id: 'layer-0',
      name: 'Background',
      imageUrl: image.localUrl || image.url,
      originalUrl: image.url, // Preserve original fal.media URL for API calls
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      opacity: 1,
      visible: true,
      isBackground: true
    };

    return {
      currentTool: EDITOR_TOOLS.SELECT,
      layers: [initialLayer],
      activeLayerId: initialLayer.id,
      canvasWidth: image.width,
      canvasHeight: image.height,
      zoom: 1, // Will be updated after component mounts
      cropArea: null,
      isProcessing: false,
      history: [{
        layers: [initialLayer],
        canvasWidth: image.width,
        canvasHeight: image.height,
        timestamp: Date.now()
      }],
      historyIndex: 0
    };
  });

  // Set initial zoom to fit image after component mounts
  useEffect(() => {
    const fitZoom = calculateFitZoom();
    setEditorState(prev => ({ ...prev, zoom: fitZoom }));
  }, [calculateFitZoom]);

  // Handle window resize to maintain fit
  useEffect(() => {
    const handleResize = () => {
      if (editorState.zoom === calculateFitZoom()) {
        // If currently at fit zoom, update to new fit zoom
        const newFitZoom = calculateFitZoom();
        setEditorState(prev => ({ ...prev, zoom: newFitZoom }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [editorState.zoom, calculateFitZoom]);

  // Zoom controls
  const handleZoomIn = () => {
    const newZoom = Math.min(editorState.zoom * 1.2, 5);
    setEditorState(prev => ({ ...prev, zoom: newZoom }));
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(editorState.zoom * 0.8, 0.1);
    setEditorState(prev => ({ ...prev, zoom: newZoom }));
  };

  const handleFitToScreen = () => {
    const fitZoom = calculateFitZoom();
    setEditorState(prev => ({ ...prev, zoom: fitZoom }));
  };

  // Save state to history
  const saveToHistory = useCallback((newState: Partial<EditorState>) => {
    const historyState = {
      layers: newState.layers || editorState.layers,
      canvasWidth: newState.canvasWidth || editorState.canvasWidth,
      canvasHeight: newState.canvasHeight || editorState.canvasHeight,
      timestamp: Date.now()
    };

    setEditorState(prev => ({
      ...prev,
      ...newState,
      history: [...prev.history.slice(0, prev.historyIndex + 1), historyState],
      historyIndex: prev.historyIndex + 1
    }));
  }, [editorState]);

  // Undo/Redo functionality
  const undo = useCallback(() => {
    if (editorState.historyIndex > 0) {
      const prevState = editorState.history[editorState.historyIndex - 1];
      setEditorState(prev => ({
        ...prev,
        layers: prevState.layers,
        canvasWidth: prevState.canvasWidth,
        canvasHeight: prevState.canvasHeight,
        historyIndex: prev.historyIndex - 1
      }));
    }
  }, [editorState]);

  const redo = useCallback(() => {
    if (editorState.historyIndex < editorState.history.length - 1) {
      const nextState = editorState.history[editorState.historyIndex + 1];
      setEditorState(prev => ({
        ...prev,
        layers: nextState.layers,
        canvasWidth: nextState.canvasWidth,
        canvasHeight: nextState.canvasHeight,
        historyIndex: prev.historyIndex + 1
      }));
    }
  }, [editorState]);

  // Tool handlers
  const handleToolChange = (toolId: string) => {
    setEditorState(prev => ({ ...prev, currentTool: toolId, cropArea: null }));
  };

  const handleCrop = async (cropArea: CropArea) => {
    if (!editorState.activeLayerId) return;
    
    setEditorState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const activeLayer = editorState.layers.find(l => l.id === editorState.activeLayerId);
      if (!activeLayer) return;

      // Create cropped image using canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = cropArea.width;
      canvas.height = cropArea.height;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = activeLayer.imageUrl;
      });

      ctx.drawImage(
        img,
        cropArea.x, cropArea.y, cropArea.width, cropArea.height,
        0, 0, cropArea.width, cropArea.height
      );

      const croppedImageUrl = canvas.toDataURL('image/png');
      
      const updatedLayers = editorState.layers.map(layer => 
        layer.id === editorState.activeLayerId 
          ? { 
              ...layer, 
              imageUrl: croppedImageUrl,
              width: cropArea.width,
              height: cropArea.height,
              x: 0,
              y: 0
            }
          : layer
      );

      saveToHistory({ 
        layers: updatedLayers,
        canvasWidth: cropArea.width,
        canvasHeight: cropArea.height,
        cropArea: null,
        currentTool: EDITOR_TOOLS.SELECT
      });
    } catch (error) {
      console.error('Crop failed:', error);
    } finally {
      setEditorState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleExtend = async (options: ExtendOptions) => {
    if (!editorState.activeLayerId) return;
    
    setEditorState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const activeLayer = editorState.layers.find(l => l.id === editorState.activeLayerId);
      if (!activeLayer) return;

      const { extendArea } = options;
      
      // Calculate extension amounts from the extend area
      const topExtension = Math.max(0, extendArea.originalY - extendArea.y);
      const bottomExtension = Math.max(0, (extendArea.y + extendArea.height) - (extendArea.originalY + extendArea.originalHeight));
      const leftExtension = Math.max(0, extendArea.originalX - extendArea.x);
      const rightExtension = Math.max(0, (extendArea.x + extendArea.width) - (extendArea.originalX + extendArea.originalWidth));

      console.log('Extending image:', { 
        imageUrl: activeLayer.imageUrl.substring(0, 50) + '...', 
        extensions: { topExtension, bottomExtension, leftExtension, rightExtension },
        newSize: { width: extendArea.width, height: extendArea.height }
      });

      // For now, we'll use the largest extension and its direction for the API
      // TODO: Update the API to support area-based extension
      let direction: 'top' | 'bottom' | 'left' | 'right' = 'right';
      let amount = rightExtension;
      
      if (topExtension > amount) {
        direction = 'top';
        amount = topExtension;
      }
      if (bottomExtension > amount) {
        direction = 'bottom';
        amount = bottomExtension;
      }
      if (leftExtension > amount) {
        direction = 'left';
        amount = leftExtension;
      }

      const response = await fetch('/api/extend-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: activeLayer.imageUrl,
          direction,
          amount,
          prompt: options.prompt || image.prompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to extend image');
      }
      
      const result: ImageExtensionResult = await response.json();
      
      // Use the extend area dimensions for the new canvas size
      const newCanvasWidth = extendArea.width;
      const newCanvasHeight = extendArea.height;
      
      // Calculate the new layer position based on the extend area
      const layerX = activeLayer.x + (extendArea.originalX - extendArea.x);
      const layerY = activeLayer.y + (extendArea.originalY - extendArea.y);

      const updatedLayers = editorState.layers.map(layer => 
        layer.id === editorState.activeLayerId 
          ? { 
              ...layer, 
              imageUrl: result.imageUrl,
              width: result.newWidth,
              height: result.newHeight,
              x: layerX,
              y: layerY
            }
          : layer
      );

      saveToHistory({ 
        layers: updatedLayers,
        canvasWidth: newCanvasWidth,
        canvasHeight: newCanvasHeight
      });
    } catch (error) {
      console.error('Extend failed:', error);
    } finally {
      setEditorState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleBackgroundRemoval = async () => {
    if (!editorState.activeLayerId) return;
    
    setEditorState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const activeLayer = editorState.layers.find(l => l.id === editorState.activeLayerId);
      if (!activeLayer) return;

      const response = await fetch('/api/remove-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: activeLayer.imageUrl })
      });

      if (!response.ok) throw new Error('Failed to remove background');
      
      const result: BackgroundRemovalResult = await response.json();
      
      const updatedLayers = editorState.layers.map(layer => 
        layer.id === editorState.activeLayerId 
          ? { 
              ...layer, 
              imageUrl: result.imageUrl,
              hasTransparency: true
            }
          : layer
      );

      saveToHistory({ layers: updatedLayers });
    } catch (error) {
      console.error('Background removal failed:', error);
    } finally {
      setEditorState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleSmartSelection = async (imageUrl: string) => {
    if (!editorState.activeLayerId) return;
    
    setEditorState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const updatedLayers = editorState.layers.map(layer => 
        layer.id === editorState.activeLayerId 
          ? { 
              ...layer, 
              imageUrl: imageUrl,
              hasTransparency: true
            }
          : layer
      );

      saveToHistory({ 
        layers: updatedLayers,
        currentTool: EDITOR_TOOLS.SELECT
      });
    } catch (error) {
      console.error('Smart selection failed:', error);
    } finally {
      setEditorState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleSmartBackgroundRemoval = async (layerId: string) => {
    const layer = editorState.layers.find(l => l.id === layerId);
    if (!layer) return;
    
    setEditorState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      console.log('Starting smart background removal for layer:', layerId);
      
      const response = await fetch('/api/remove-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: layer.imageUrl })
      });

      if (!response.ok) throw new Error('Background removal failed');
      
      const result = await response.json();
      
      // Load the background-removed image and crop to subject bounds
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = result.imageUrl;
      });
      
      // Create canvas to analyze and crop the subject
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const bounds = getSubjectBounds(imageData);
      
      if (bounds) {
        // Crop to subject bounds
        const croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d');
        if (!croppedCtx) return;
        
        croppedCanvas.width = bounds.width;
        croppedCanvas.height = bounds.height;
        
        croppedCtx.drawImage(
          img,
          bounds.x, bounds.y, bounds.width, bounds.height,
          0, 0, bounds.width, bounds.height
        );
        
        const croppedImageUrl = croppedCanvas.toDataURL('image/png');
        
        // Update layer with cropped image and adjusted position
        const updatedLayers = editorState.layers.map(l => 
          l.id === layerId 
            ? { 
                ...l, 
                imageUrl: croppedImageUrl,
                x: layer.x + bounds.x * (layer.width / img.width), // Adjust position
                y: layer.y + bounds.y * (layer.height / img.height),
                width: bounds.width * (layer.width / img.width), // Adjust size
                height: bounds.height * (layer.height / img.height),
                hasTransparency: true
              }
            : l
        );

        saveToHistory({ layers: updatedLayers });
        console.log('Smart background removal and cropping completed:', {
          original: `${img.width}x${img.height}`,
          cropped: `${bounds.width}x${bounds.height}`,
          bounds
        });
      } else {
        // Fallback: no cropping if no subject found
        const updatedLayers = editorState.layers.map(l => 
          l.id === layerId 
            ? { 
                ...l, 
                imageUrl: result.imageUrl,
                hasTransparency: true
              }
            : l
        );
        saveToHistory({ layers: updatedLayers });
      }
      
    } catch (error) {
      console.error('Smart background removal failed:', error);
    } finally {
      setEditorState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Helper function to find the bounds of non-transparent pixels
  const getSubjectBounds = (imageData: ImageData) => {
    const { width, height, data } = imageData;
    let minX = width, minY = height, maxX = -1, maxY = -1;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 0) { // Non-transparent pixel
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    if (maxX === -1) return null; // No subject found
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  };

  const handleCanvasResize = async (options: CanvasResizeOptions) => {
    const { width, height, maintainCenter = true, scaleContent = false } = options;
    
    setEditorState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      let updatedLayers = [...editorState.layers];
      
      if (scaleContent) {
        // Smart scaling with quality preservation
        const scaleX = width / editorState.canvasWidth;
        const scaleY = height / editorState.canvasHeight;
        
        // Use uniform scaling to preserve aspect ratios
        const uniformScale = Math.min(scaleX, scaleY);
        
        // For each layer, create a high-quality scaled version if significantly different
        const scaledLayers = await Promise.all(
          editorState.layers.map(async (layer) => {
            let newImageUrl = layer.imageUrl;
            
            // Only re-render if scaling significantly (>10% change)
            if (Math.abs(uniformScale - 1) > 0.1) {
              try {
                // Create a high-quality scaled version using canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  const img = new Image();
                  img.crossOrigin = 'anonymous';
                  
                  await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = layer.imageUrl;
                  });

                  const newWidth = Math.round(layer.width * uniformScale);
                  const newHeight = Math.round(layer.height * uniformScale);
                  
                  canvas.width = newWidth;
                  canvas.height = newHeight;
                  
                  // Use high-quality scaling settings
                  ctx.imageSmoothingEnabled = true;
                  ctx.imageSmoothingQuality = 'high';
                  
                  ctx.drawImage(img, 0, 0, newWidth, newHeight);
                  newImageUrl = canvas.toDataURL('image/png');
                }
              } catch (error) {
                console.warn('Failed to create high-quality scaled image:', error);
                // Fall back to CSS scaling
              }
            }

            return {
              ...layer,
              imageUrl: newImageUrl,
              x: layer.x * scaleX,
              y: layer.y * scaleY,
              width: layer.width * uniformScale,
              height: layer.height * uniformScale
            };
          })
        );
        
        updatedLayers = scaledLayers;
      } else if (maintainCenter) {
        // Reposition layers to maintain center alignment
        const offsetX = (width - editorState.canvasWidth) / 2;
        const offsetY = (height - editorState.canvasHeight) / 2;
        
        updatedLayers = editorState.layers.map(layer => ({
          ...layer,
          x: layer.x + offsetX,
          y: layer.y + offsetY
        }));
      }
      
      saveToHistory({
        layers: updatedLayers,
        canvasWidth: width,
        canvasHeight: height,
        currentTool: EDITOR_TOOLS.SELECT
      });
    } catch (error) {
      console.error('Canvas resize failed:', error);
    } finally {
      setEditorState(prev => ({ ...prev, isProcessing: false }));
    }
  };


  const handleLayerUpdate = (layerId: string, updates: Partial<EditorLayer>) => {
    const updatedLayers = editorState.layers.map(layer => 
      layer.id === layerId ? { ...layer, ...updates } : layer
    );
    
    setEditorState(prev => ({ ...prev, layers: updatedLayers }));
  };

  const handleLayerDelete = (layerId: string) => {
    if (editorState.layers.length <= 1) return; // Keep at least one layer
    
    const updatedLayers = editorState.layers.filter(layer => layer.id !== layerId);
    const newActiveId = updatedLayers[0]?.id || null;
    
    saveToHistory({ 
      layers: updatedLayers,
      activeLayerId: newActiveId
    });
  };

  const handleLayerReorder = (dragIndex: number, hoverIndex: number) => {
    const updatedLayers = [...editorState.layers];
    const [draggedLayer] = updatedLayers.splice(dragIndex, 1);
    updatedLayers.splice(hoverIndex, 0, draggedLayer);
    
    saveToHistory({ layers: updatedLayers });
  };

  const handleImportImage = () => {
    fileInputRef.current?.click();
  };

  // Handle file drop/import
  const handleFilesDrop = async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsImporting(true);
    
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          console.warn(`File ${file.name} is too large (max 10MB)`);
          continue;
        }

        // Create a data URL for the image
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Get image dimensions
        const img = new Image();
        const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
          img.onload = () => resolve({ width: img.width, height: img.height });
          img.onerror = reject;
          img.src = dataUrl;
        });

        // Smart scaling: Match original background dimensions for consistency
        const backgroundLayer = editorState.layers.find(l => l.isBackground);
        let scale = 1;
        
        if (backgroundLayer) {
          // Calculate original background dimensions (before any scaling/extension)
          const originalBackgroundWidth = backgroundLayer.width / backgroundLayer.scaleX;
          const originalBackgroundHeight = backgroundLayer.height / backgroundLayer.scaleY;
          
          // Scale to match original background size, not current canvas
          const scaleX = originalBackgroundWidth / width;
          const scaleY = originalBackgroundHeight / height;
          scale = Math.min(scaleX, scaleY, 1); // Don't upscale beyond original size
          
          console.log('Smart import scaling:', {
            originalBackground: `${originalBackgroundWidth}x${originalBackgroundHeight}`,
            importImage: `${width}x${height}`,
            calculatedScale: scale
          });
        } else {
          // Fallback to canvas-based scaling if no background layer
          const maxSize = Math.min(editorState.canvasWidth, editorState.canvasHeight) * 0.5;
          scale = Math.min(maxSize / width, maxSize / height, 1);
        }
        
        const layerWidth = width * scale;
        const layerHeight = height * scale;
        
        // Center the layer on the (possibly extended) canvas
        const x = (editorState.canvasWidth - layerWidth) / 2;
        const y = (editorState.canvasHeight - layerHeight) / 2;

        const newLayer: EditorLayer = {
          id: `layer-${Date.now()}-${Math.random()}`,
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
          imageUrl: dataUrl,
          // Note: Imported files don't have originalUrl - will be handled by API upload
          x: Math.max(0, x),
          y: Math.max(0, y),
          width: layerWidth,
          height: layerHeight,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          opacity: 1,
          visible: true
        };

        // Add the layer to the editor
        const updatedLayers = [...editorState.layers, newLayer];
        
        saveToHistory({ 
          layers: updatedLayers,
          activeLayerId: newLayer.id
        });

        // Auto-remove background if enabled
        if (autoRemoveBackground) {
          console.log('Auto-removing background for imported layer:', newLayer.id);
          // Small delay to ensure the layer is properly added
          setTimeout(() => {
            handleSmartBackgroundRemoval(newLayer.id);
          }, 100);
        }
      }
    } catch (error) {
      console.error('Failed to import files:', error);
    } finally {
      setIsImporting(false);
    }
  };

  // Handle traditional file input
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFilesDrop(files);
    }
    // Reset input value to allow re-importing the same file
    e.target.value = '';
  };

  // Handle adding asset from library
  const handleAddAsset = async (imageUrl: string, name: string) => {
    // Convert to File-like object and process through existing pipeline
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], name, { type: blob.type });
      await handleFilesDrop([file]);
    } catch (error) {
      console.error('Failed to add asset:', error);
    }
  };


  const handleSave = useCallback(async () => {
    if (!canvasRef.current) return;
    
    setEditorState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      // Render all layers to canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = editorState.canvasWidth;
      canvas.height = editorState.canvasHeight;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Render layers in order
      for (const layer of editorState.layers) {
        if (!layer.visible) continue;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = layer.imageUrl;
        });

        ctx.save();
        ctx.globalAlpha = layer.opacity;
        
        // Calculate actual layer dimensions with scaling
        const scaledWidth = layer.width * layer.scaleX;
        const scaledHeight = layer.height * layer.scaleY;
        
        // Translate to layer center for rotation/scaling
        ctx.translate(layer.x + scaledWidth / 2, layer.y + scaledHeight / 2);
        ctx.rotate(layer.rotation * Math.PI / 180);
        ctx.scale(layer.scaleX, layer.scaleY);
        
        // Draw image from its center
        ctx.drawImage(img, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
        ctx.restore();
      }

      const editedImageUrl = canvas.toDataURL('image/png');
      
      // Save to gallery with enhanced metadata
      await saveToGallery(editedImageUrl);
      
      onSave?.(editedImageUrl);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setEditorState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [editorState, onSave, image]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveToGallery = async (imageDataUrl: string) => {
    try {
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Create form data for upload
      const formData = new FormData();
      const filename = `edited_${Date.now()}.png`;
      formData.append('image', blob, filename);
      
      // Download to local storage
      const downloadResponse = await fetch('/api/download-image', {
        method: 'POST',
        body: formData
      });
      
      if (!downloadResponse.ok) {
        throw new Error('Failed to save image to gallery');
      }
      
      const { localUrl, filename: savedFilename } = await downloadResponse.json();
      
      // Prepare enhanced metadata
      const editMetadata = {
        originalImage: {
          url: image.url,
          prompt: image.prompt,
          modelUsed: image.modelUsed,
          timestamp: image.timestamp
        },
        layers: editorState.layers.map(layer => ({
          id: layer.id,
          name: layer.name,
          x: layer.x,
          y: layer.y,
          width: layer.width,
          height: layer.height,
          scaleX: layer.scaleX,
          scaleY: layer.scaleY,
          rotation: layer.rotation,
          opacity: layer.opacity,
          visible: layer.visible,
          isBackground: layer.isBackground,
          hasTransparency: layer.hasTransparency
        })),
        canvasDimensions: {
          width: editorState.canvasWidth,
          height: editorState.canvasHeight
        },
        editHistory: {
          totalSteps: editorState.history.length,
          toolsUsed: [...new Set(editorState.history.map(() => editorState.currentTool))]
        }
      };
      
      // Create new gallery entry
      const newGalleryImage = {
        url: localUrl,
        localUrl,
        filename: savedFilename,
        prompt: `Edited: ${image.prompt}`,
        width: editorState.canvasWidth,
        height: editorState.canvasHeight,
        timestamp: Date.now(),
        modelUsed: 'Image Editor',
        editMetadata
      };
      
      // Update gallery metadata
      const metadataResponse = await fetch('/api/metadata');
      const currentMetadata = metadataResponse.ok ? await metadataResponse.json() : { images: [] };
      
      const updatedMetadata = {
        images: [newGalleryImage, ...currentMetadata.images]
      };
      
      await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMetadata)
      });
      
      console.log('Image saved to gallery successfully');
      
    } catch (error) {
      console.error('Failed to save to gallery:', error);
      // Don't throw - save operation should continue even if gallery save fails
    }
  };

  const handleExport = async (format: 'png' | 'jpg' | 'webp' = 'png', quality: number = 0.9) => {
    if (!canvasRef.current) return;
    
    setEditorState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      // Render all layers to canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = editorState.canvasWidth;
      canvas.height = editorState.canvasHeight;
      
      // For JPG format, add white background
      if (format === 'jpg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      // Render layers in order
      for (const layer of editorState.layers) {
        if (!layer.visible) continue;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = layer.imageUrl;
        });

        ctx.save();
        ctx.globalAlpha = layer.opacity;
        
        // Calculate actual layer dimensions with scaling
        const scaledWidth = layer.width * layer.scaleX;
        const scaledHeight = layer.height * layer.scaleY;
        
        // Translate to layer center for rotation/scaling
        ctx.translate(layer.x + scaledWidth / 2, layer.y + scaledHeight / 2);
        ctx.rotate(layer.rotation * Math.PI / 180);
        ctx.scale(layer.scaleX, layer.scaleY);
        
        // Draw image from its center
        ctx.drawImage(img, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
        ctx.restore();
      }

      // Get appropriate MIME type and quality
      const mimeType = format === 'png' ? 'image/png' : 
                       format === 'jpg' ? 'image/jpeg' : 'image/webp';
      const exportedImageUrl = canvas.toDataURL(mimeType, quality);
      
      // Create download link
      const link = document.createElement('a');
      link.href = exportedImageUrl;
      link.download = `edited_image_${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`Image exported as ${format.toUpperCase()}`);
      
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setEditorState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Video generation handlers
  const handleVideoGeneration = async (params: VideoGenerationParams) => {
    try {
      // First, render the current composition to get the source image
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      canvas!.width = editorState.canvasWidth;
      canvas!.height = editorState.canvasHeight;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      
      // Render layers in order
      for (const layer of editorState.layers) {
        if (!layer.visible) continue;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = layer.imageUrl;
        });

        ctx.save();
        ctx.globalAlpha = layer.opacity;
        
        // Calculate actual layer dimensions with scaling
        const scaledWidth = layer.width * layer.scaleX;
        const scaledHeight = layer.height * layer.scaleY;
        
        // Translate to layer center for rotation/scaling
        ctx.translate(layer.x + scaledWidth / 2, layer.y + scaledHeight / 2);
        ctx.rotate(layer.rotation * Math.PI / 180);
        ctx.scale(layer.scaleX, layer.scaleY);
        
        // Draw image from its center
        ctx.drawImage(img, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
        ctx.restore();
      }

      const compositionImageUrl = canvas!.toDataURL('image/png');
      
      // Generate video with the rendered composition
      const result = await generateVideo({
        ...params,
        imageUrl: compositionImageUrl
      });
      
      setCurrentVideoTask(result.taskId);
      setShowVideoModal(false); // Hide form, show progress
      
    } catch (error) {
      console.error('Video generation failed:', error);
    }
  };

  const handleVideoComplete = (video: GeneratedVideo) => {
    addGeneratedVideo(video);
    setCurrentVideoTask(null);
    console.log('Video generation completed:', video);
  };

  const handleVideoError = (error: string) => {
    console.error('Video generation error:', error);
    setCurrentVideoTask(null);
  };

  const handleVideoCancelOrRetry = () => {
    setCurrentVideoTask(null);
    setShowVideoModal(true); // Show form again
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 's':
            e.preventDefault();
            handleSave();
            break;
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [undo, redo, onClose, handleSave]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
              <div className="bg-card text-card-foreground p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Image Editor</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={editorState.historyIndex <= 0}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={editorState.historyIndex >= editorState.history.length - 1}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            <Button variant="ghost" size="sm" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleFitToScreen} title="Fit to Screen">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            variant={autoRemoveBackground ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRemoveBackground(!autoRemoveBackground)}
            title="Automatically remove background from imported images"
          >
            <Scissors className="h-4 w-4 mr-1" />
            Auto-BG: {autoRemoveBackground ? "ON" : "OFF"}
          </Button>
          <Button variant="default" size="sm" onClick={handleImportImage}>
            <Upload className="h-4 w-4 mr-2" />
            Add Subject
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSave}
            disabled={editorState.isProcessing}
          >
            {editorState.isProcessing ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Save to Gallery
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setShowExportModal(true)}
            disabled={editorState.isProcessing}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowVideoModal(true)}
            disabled={editorState.isProcessing || isGeneratingVideo}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
          >
            <Play className="h-4 w-4 mr-2" />
            Generate Video
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Toolbar */}
        <EditorToolbar
          currentTool={editorState.currentTool}
          onToolChange={handleToolChange}
          onBackgroundRemoval={handleBackgroundRemoval}
          isProcessing={editorState.isProcessing}
        />

        {/* Main Canvas Area with Drag & Drop */}
        <div className="flex-1 relative">
          <DropZone
            onFilesDrop={handleFilesDrop}
            onDragStateChange={setIsDragActive}
            isActive={!editorState.isProcessing && !isImporting}
          >
            <div ref={canvasContainerRef} className="absolute inset-0 bg-muted overflow-hidden">
            {/* Import overlay */}
            {(isImporting || isDragActive) && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
                <div className="bg-white rounded-lg p-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    {isImporting ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <Upload className="h-6 w-6 text-primary" />
                    )}
                    <span className="font-medium">
                      {isImporting ? 'Importing images...' : 'Drop to add images'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <EditorCanvas
              ref={canvasRef}
              editorState={editorState}
              onLayerUpdate={handleLayerUpdate}
              onStateUpdate={(updates: Partial<EditorState>) => setEditorState(prev => ({ ...prev, ...updates }))}
            />
          
          {/* Tool Overlays */}
          {editorState.currentTool === EDITOR_TOOLS.CROP && (
            <CropTool
              canvasWidth={editorState.canvasWidth}
              canvasHeight={editorState.canvasHeight}
              zoom={editorState.zoom}
              onCrop={handleCrop}
              onCancel={() => handleToolChange(EDITOR_TOOLS.SELECT)}
            />
          )}
          
          {editorState.currentTool === EDITOR_TOOLS.EXTEND && (
            <ExtendTool
              canvasWidth={editorState.canvasWidth}
              canvasHeight={editorState.canvasHeight}
              zoom={editorState.zoom}
              onExtend={handleExtend}
              onCancel={() => handleToolChange(EDITOR_TOOLS.SELECT)}
              isProcessing={editorState.isProcessing}
            />
          )}

          {editorState.currentTool === EDITOR_TOOLS.SMART_SELECT && (
            <SelectTool
              activeLayerId={editorState.activeLayerId}
              layers={editorState.layers}
              canvasWidth={editorState.canvasWidth}
              canvasHeight={editorState.canvasHeight}
              zoom={editorState.zoom}
              onSelectionComplete={handleSmartSelection}
              onCancel={() => handleToolChange(EDITOR_TOOLS.SELECT)}
              isProcessing={editorState.isProcessing}
            />
          )}

          {editorState.currentTool === EDITOR_TOOLS.PERSPECTIVE && editorState.activeLayerId && (
            <PerspectiveTool
              layer={editorState.layers.find(l => l.id === editorState.activeLayerId)!}
              canvasWidth={editorState.canvasWidth}
              canvasHeight={editorState.canvasHeight}
              zoom={editorState.zoom}
              onLayerUpdate={handleLayerUpdate}
              onCancel={() => handleToolChange(EDITOR_TOOLS.SELECT)}
              onApply={() => {
                saveToHistory({ layers: editorState.layers });
                handleToolChange(EDITOR_TOOLS.SELECT);
              }}
              getImageBounds={() => {
                if (!canvasContainerRef.current) return { x: 0, y: 0, width: 0, height: 0 };
                
                const container = canvasContainerRef.current;
                const containerWidth = container.clientWidth;
                const containerHeight = container.clientHeight;
                
                const imageWidth = editorState.canvasWidth * editorState.zoom;
                const imageHeight = editorState.canvasHeight * editorState.zoom;
                
                const x = (containerWidth - imageWidth) / 2;
                const y = (containerHeight - imageHeight) / 2;
                
                return { x, y, width: imageWidth, height: imageHeight };
              }}
            />
          )}
            </div>
          </DropZone>
        </div>

        {/* Canvas Tool Modal */}
        {editorState.currentTool === EDITOR_TOOLS.CANVAS && (
          <CanvasTool
            currentWidth={editorState.canvasWidth}
            currentHeight={editorState.canvasHeight}
            onResize={handleCanvasResize}
            onCancel={() => handleToolChange(EDITOR_TOOLS.SELECT)}
            isProcessing={editorState.isProcessing}
          />
        )}

        {/* Right Panel - Dynamic */}
        <div className="flex flex-col">
          {/* Panel Toggle */}
          <div className="bg-card border-l border-b border-border p-2 flex">
            <Button
              variant={rightPanelMode === 'layers' ? "default" : "ghost"}
              size="sm"
              onClick={() => setRightPanelMode('layers')}
              className="flex-1 mr-1"
            >
              <Layers className="h-4 w-4 mr-2" />
              Layers
            </Button>
            <Button
              variant={rightPanelMode === 'assets' ? "default" : "ghost"}
              size="sm"
              onClick={() => setRightPanelMode('assets')}
              className="flex-1 ml-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Assets
            </Button>
          </div>

          {/* Panel Content */}
          {rightPanelMode === 'layers' ? (
            <LayerPanel
              layers={editorState.layers}
              activeLayerId={editorState.activeLayerId}
              canvasWidth={editorState.canvasWidth}
              canvasHeight={editorState.canvasHeight}
              onLayerSelect={(layerId: string) => setEditorState(prev => ({ ...prev, activeLayerId: layerId }))}
              onLayerUpdate={handleLayerUpdate}
              onLayerDelete={handleLayerDelete}
              onLayerReorder={handleLayerReorder}
              onAddLayer={() => handleImportImage()}
            />
          ) : (
            <AssetLibrary
              onAddAsset={handleAddAsset}
            />
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        canvasWidth={editorState.canvasWidth}
        canvasHeight={editorState.canvasHeight}
        isProcessing={editorState.isProcessing}
      />

      {/* Video Generation Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold">Generate Video from Composition</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowVideoModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <VideoGenerationForm
                sourceImage={null} // Will be generated from canvas
                initialPrompt={`Animate this ${image.prompt ? 'artistic composition' : 'image'} with smooth, natural motion`}
                onGenerate={handleVideoGeneration}
                isGenerating={isGeneratingVideo}
              />
            </div>
          </div>
        </div>
      )}

      {/* Video Progress Tracker */}
      {currentVideoTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-2xl w-full">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold">Video Generation Progress</h2>
            </div>
            <div className="p-4">
              <VideoProgressTracker
                taskId={currentVideoTask}
                onComplete={handleVideoComplete}
                onError={handleVideoError}
                onCancel={handleVideoCancelOrRetry}
                checkVideoStatus={checkVideoStatus}
                parameters={{
                  prompt: 'Generated from image composition',
                  duration: 5,
                  aspectRatio: '16:9',
                  motion: 'medium',
                  model: 'kling-v1',
                  creativityLevel: 0.5
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 