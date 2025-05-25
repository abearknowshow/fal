import { useState, useCallback } from 'react';
import { FormData, GenerationResult, GeneratedImage, GalleryImage } from '@/types/image-generation';
import { imageCache } from '@/lib/imageCache';

const initialFormData: FormData = {
  prompt: "",
  seed: "",
  num_images: 4,
  enable_safety_checker: false,
  safety_tolerance: "5",
  output_format: "png",
  aspect_ratio: "4:3",
  raw: false,
  finetune_id: "ea3f8df2-0282-4566-84f7-7ba0c4f2c618",
  finetune_strength: 0.8,
};

export const useImageGeneration = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadErrors, setDownloadErrors] = useState<string[]>([]);

  const handleInputChange = useCallback((field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const autoCacheImage = async (image: GeneratedImage, prompt: string, seed: number, modelUsed?: string, finetuneId?: string, retryCount = 0): Promise<GalleryImage> => {
    const maxRetries = 3;
    const retryDelay = 1000 * (retryCount + 1); // Exponential backoff: 1s, 2s, 3s
    const timestamp = Date.now();
    
    // First, cache the image in browser storage for immediate access
    let cachedUrl = image.url;
    try {
      console.log(`Caching image in browser storage: ${image.url}`);
      cachedUrl = await imageCache.cacheImage(image.url, {
        prompt,
        seed,
        width: image.width,
        height: image.height,
        modelUsed,
        finetuneId,
        timestamp
      });
      console.log(`Image cached successfully, using cached URL: ${cachedUrl}`);
    } catch (cacheError) {
      console.warn('Failed to cache image in browser storage:', cacheError);
      // Continue with original URL if caching fails
    }
    
    // Create the gallery image with cached URL for immediate display
    const galleryImage: GalleryImage = {
      url: image.url,
      localUrl: cachedUrl, // Use cached URL initially
      width: image.width,
      height: image.height,
      prompt,
      seed,
      modelUsed,
      finetuneId,
      timestamp
    };
    
    // Start background download to local storage
    const downloadInBackground = async () => {
      const cacheId = `${seed}-${timestamp}`;
      
      try {
        await imageCache.updateDownloadStatus(cacheId, 'downloading');
        
        const fileName = `fal-${seed}-${timestamp}.png`;
        console.log(`Attempting to download image: ${fileName} (attempt ${retryCount + 1}/${maxRetries + 1})`);
        
        const response = await fetch('/api/download-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: image.url,
            fileName,
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          console.log(`Successfully downloaded image: ${fileName}`);
          await imageCache.updateDownloadStatus(cacheId, 'completed', data.localUrl);
          
          // Update the gallery image with local URL
          galleryImage.localUrl = data.localUrl;
          
          return data.localUrl;
        } else {
          throw new Error(data.error || 'Download failed');
        }
      } catch (error) {
        console.error(`Failed to download image (attempt ${retryCount + 1}):`, error);
        
        if (retryCount < maxRetries) {
          console.log(`Retrying download in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return downloadInBackground(); // Retry the background download
        } else {
          console.error(`Failed to download image after ${maxRetries + 1} attempts`);
          await imageCache.updateDownloadStatus(cacheId, 'failed');
          setDownloadErrors(prev => [...prev, `Failed to download image after ${maxRetries + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`]);
          return null;
        }
      }
    };
    
    // Start background download but don't wait for it
    downloadInBackground().catch(console.error);
    
    // Return gallery image immediately with cached URL
    return galleryImage;
  };

  const generateImage = async (onImagesGenerated?: (images: GalleryImage[]) => void) => {
    if (!formData.prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setDownloadErrors([]);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          seed: formData.seed ? parseInt(formData.seed) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      setResult(data.data);
      
      if (data.data && data.data.images) {
        console.log(`Starting sequential auto-cache for ${data.data.images.length} images`);
        const cachedImages: GalleryImage[] = [];
        
        // Download images sequentially to avoid overwhelming the server
        for (let i = 0; i < data.data.images.length; i++) {
          const image = data.data.images[i];
          console.log(`Downloading image ${i + 1} of ${data.data.images.length}`);
          const cachedImage = await autoCacheImage(image, data.data.prompt, data.data.seed, data.data.modelUsed, data.finetuneId);
          cachedImages.push(cachedImage);
          
          // Add a small delay between downloads to be respectful to the server
          if (i < data.data.images.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        const successfulDownloads = cachedImages.filter(img => img.localUrl).length;
        console.log(`Successfully downloaded ${successfulDownloads} of ${cachedImages.length} images`);
        
        if (onImagesGenerated) {
          onImagesGenerated(cachedImages);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const clearDownloadErrors = useCallback(() => {
    setDownloadErrors([]);
  }, []);

  return {
    formData,
    isGenerating,
    result,
    error,
    downloadErrors,
    handleInputChange,
    generateImage,
    clearDownloadErrors,
    setFormData
  };
}; 