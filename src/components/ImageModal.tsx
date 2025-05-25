"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { GalleryImage } from "@/types/image-generation";

interface ImageModalProps {
  image: GalleryImage | null;
  images: GalleryImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export default function ImageModal({
  image,
  images,
  currentIndex,
  onClose,
  onNavigate
}: ImageModalProps) {
  // Download image utility
  const downloadImage = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fal-generated-${prompt.slice(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!image) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onNavigate('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNavigate('next');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    if (image) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [image, onNavigate, onClose]);

  if (!image) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto relative" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            {/* Left Arrow */}
            <button
              onClick={() => onNavigate('prev')}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            {/* Right Arrow */}
            <button
              onClick={() => onNavigate('next')}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition-all"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
        
        <div className="p-4">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">Generated Image</h3>
              {images.length > 1 && (
                <p className="text-sm text-gray-500">
                  {currentIndex + 1} of {images.length}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadImage(image.localUrl || image.url, image.prompt)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(image.localUrl || image.url, '_blank')}
              >
                View Full Size
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                ✕
              </Button>
            </div>
          </div>
          
          {/* Image */}
          <Image
            src={image.localUrl || image.url}
            alt="Expanded generated image"
            width={image.width}
            height={image.height}
            className="w-full h-auto rounded-lg shadow-md mb-4"
            priority
          />
          
          {/* Image Details */}
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Prompt:</strong> {image.prompt}</p>
            <p><strong>Seed:</strong> {image.seed}</p>
            {image.modelUsed && (
              <p><strong>Model:</strong> {image.modelUsed}</p>
            )}
            <p><strong>Generated:</strong> {new Date(image.timestamp).toLocaleString()}</p>
          </div>
          
          {/* Keyboard Hints */}
          {images.length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400 text-center">
                Use ← → arrow keys to navigate • ESC to close
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 