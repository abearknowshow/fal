"use client";

import Image from "next/image";
import { GenerationResult, GalleryImage } from "@/types/image-generation";

interface ImageResultsProps {
  result: GenerationResult | null;
  isGenerating: boolean;
  error: string | null;
  onImageClick: (image: GalleryImage, index: number) => void;
}

export default function ImageResults({
  result,
  isGenerating,
  error,
  onImageClick
}: ImageResultsProps) {
  if (error) {
    return (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
      <p className="text-destructive text-sm">{error}</p>
    </div>
    );
  }
  
  if (isGenerating) {
    return (
      <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      <span className="ml-2 text-muted-foreground">Generating image...</span>
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p><strong>Prompt:</strong> {result.prompt}</p>
          <p><strong>Seed:</strong> {result.seed}</p>
          {result.modelUsed && (
            <p><strong>Model:</strong> {result.modelUsed}</p>
          )}
        </div>
        <div className="space-y-4">
          {result.images.map((image, index) => (
            <div key={index}>
              <Image
                src={image.url}
                alt={`Generated image ${index + 1}`}
                width={image.width}
                height={image.height}
                className="w-full h-auto rounded-lg shadow-md cursor-pointer transition-transform hover:scale-[1.02]"
                loading="lazy"
                onClick={() => {
                  // Create temporary gallery image for modal
                  const tempGalleryImage: GalleryImage = {
                    url: image.url,
                    width: image.width,
                    height: image.height,
                    prompt: result.prompt,
                    seed: result.seed,
                    modelUsed: result.modelUsed,
                    timestamp: Date.now()
                  };
                  onImageClick(tempGalleryImage, 0);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center text-muted-foreground py-8">
      <p>Generate an image to see results here</p>
    </div>
  );
} 