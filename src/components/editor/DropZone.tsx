"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Image as ImageIcon, FileX } from "lucide-react";

interface DropZoneProps {
  onFilesDrop: (files: File[]) => void;
  onDragStateChange?: (isDragging: boolean) => void;
  isActive: boolean;
  children: React.ReactNode;
}

export function DropZone({ onFilesDrop, onDragStateChange, isActive, children }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
      onDragStateChange?.(true);
    }
  }, [onDragStateChange]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only hide if leaving the drop zone entirely
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      onDragStateChange?.(false);
    }
  }, [onDragStateChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    onDragStateChange?.(false);

    const files = Array.from(e.dataTransfer?.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      onFilesDrop(imageFiles);
    }
  }, [onFilesDrop, onDragStateChange]);


  if (!isActive) {
    return <div>{children}</div>;
  }

  return (
    <div
      ref={dropZoneRef}
      className="relative w-full h-full"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      
      {/* Drop overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-primary/20 border-4 border-dashed border-primary z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            
            <h3 className="text-xl font-semibold mb-2">Drop Images Here</h3>
            <p className="text-gray-600 mb-4">
              Drop your images to add them as new layers
            </p>
            
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                JPG, PNG, WebP
              </div>
              <div className="flex items-center gap-2">
                <FileX className="h-4 w-4" />
                Max 10MB
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}