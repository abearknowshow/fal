"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { GalleryImage } from "@/types/image-generation";
import { Download, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface ImageGalleryProps {
  images: GalleryImage[];
  isLoading: boolean;
  downloadErrors: string[];
  onImageClick: (image: GalleryImage, index: number) => void;
  onClearErrors: () => void;
}

export default function ImageGallery({
  images,
  isLoading,
  downloadErrors,
  onImageClick,
  onClearErrors
}: ImageGalleryProps) {
  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground mx-auto mb-2"></div>
        <p>Loading your gallery...</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No images generated yet. Create some images to see them here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Download Error Messages */}
      {downloadErrors.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
          <div className="text-yellow-600 dark:text-yellow-400">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium text-sm">Some images failed to download locally:</p>
                <ul className="text-xs mt-1 list-disc list-inside">
                  {downloadErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
                <p className="text-xs mt-2">Images will still be viewable from the original URLs.</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearErrors}
                className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 p-1 h-auto"
              >
                ✕
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Header */}
      <div className="space-y-3 pb-3 border-b border-border">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {images.length} images in gallery
          </span>
        </div>
      </div>
      
      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => {
          const getStatusIcon = () => {
            switch (image.downloadStatus) {
              case 'downloading':
                return <Download className="h-4 w-4 animate-pulse text-primary" />;
              case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
              case 'failed':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
              case 'pending':
                return <Clock className="h-4 w-4 text-yellow-500" />;
              default:
                return null;
            }
          };

          const getStatusText = () => {
            switch (image.downloadStatus) {
              case 'downloading':
                return 'Downloading...';
              case 'completed':
                return 'Downloaded';
              case 'failed':
                return 'Download failed';
              case 'pending':
                return 'Download pending';
              case 'cached':
                return 'Cached in browser';
              default:
                return '';
            }
          };

          return (
            <div
              key={`${image.url}-${image.timestamp}`}
              className="relative cursor-pointer group"
              onClick={() => onImageClick(image, index)}
            >
              <Image
                src={image.localUrl || image.url}
                alt={`Generated image ${index + 1}`}
                width={200}
                height={200}
                className="w-full h-32 object-cover rounded-lg shadow-md transition-transform group-hover:scale-105"
                loading="lazy"
              />
              
              {/* Download status indicator */}
              {image.downloadStatus && image.downloadStatus !== 'completed' && (
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 rounded-full p-1">
                  {getStatusIcon()}
                </div>
              )}
              
              {/* Overlay with image info on hover */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex flex-col justify-between p-2">
                <div className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  {getStatusText() && (
                    <div className="flex items-center gap-1 mb-1">
                      {getStatusIcon()}
                      <span>{getStatusText()}</span>
                    </div>
                  )}
                </div>
                <div className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity truncate">
                  {image.prompt.length > 30 ? `${image.prompt.slice(0, 30)}...` : image.prompt}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 