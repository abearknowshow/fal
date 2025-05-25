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
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }
  
  if (isGenerating) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2 text-gray-600">Generating image...</span>
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
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
    <div className="text-center text-gray-500 py-8">
      <p>Generate an image to see results here</p>
    </div>
  );
} 