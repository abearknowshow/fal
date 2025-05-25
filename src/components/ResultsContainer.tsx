"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { GenerationResult, GalleryImage } from "@/types/image-generation";
import ImageGallery from "./ImageGallery";
import ImageResults from "./ImageResults";

interface ResultsContainerProps {
  showGallery: boolean;
  sortedGalleryImages: GalleryImage[];
  isLoadingGallery: boolean;
  galleryLoadedMessage: string | null;
  downloadErrors: string[];
  result: GenerationResult | null;
  isGenerating: boolean;
  error: string | null;
  onToggleGallery: () => void;
  onImageClick: (image: GalleryImage, index: number) => void;
  onClearErrors: () => void;
  onRefreshGallery: () => void;
}

export default function ResultsContainer({
  showGallery,
  sortedGalleryImages,
  isLoadingGallery,
  galleryLoadedMessage,
  downloadErrors,
  result,
  isGenerating,
  error,
  onToggleGallery,
  onImageClick,
  onClearErrors,
  onRefreshGallery
}: ResultsContainerProps) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {showGallery ? "Image Gallery" : "Generated Images"}
            </CardTitle>
            <CardDescription>
              {showGallery 
                ? `${sortedGalleryImages.length} images in your gallery (all saved files with metadata)`
                : "Your generated images will appear here"
              }
            </CardDescription>
          </div>
          {!showGallery && !isLoadingGallery && sortedGalleryImages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleGallery}
            >
              View Gallery ({sortedGalleryImages.length})
            </Button>
          )}
          {showGallery && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefreshGallery}
                disabled={isLoadingGallery}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingGallery ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleGallery}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="min-h-[400px]">
        {/* Gallery Loaded Notification - now inside the card */}
        {galleryLoadedMessage && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-green-700 dark:text-green-400 text-sm font-medium">{galleryLoadedMessage}</p>
          </div>
        )}

        {showGallery ? (
          <ImageGallery
            images={sortedGalleryImages}
            isLoading={isLoadingGallery}
            downloadErrors={downloadErrors}
            onImageClick={onImageClick}
            onClearErrors={onClearErrors}
          />
        ) : (
          <ImageResults
            result={result}
            isGenerating={isGenerating}
            error={error}
            onImageClick={onImageClick}
          />
        )}
      </CardContent>
    </Card>
  );
} 