import { useState, useEffect, useCallback } from 'react';
import { GalleryImage, ImageFileInfo, ImageMetadata, GALLERY_STORAGE_KEY, FINETUNE_CONFIGS } from '@/types/image-generation';
import { imageCache, CachedImage } from '@/lib/imageCache';

// Filter options for finetune models
export type FinetuneFilter = 'all' | 'brawler' | 'prop' | 'none';

export const useGallery = () => {
  const [allGeneratedImages, setAllGeneratedImages] = useState<GalleryImage[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  const [galleryLoadedMessage, setGalleryLoadedMessage] = useState<string | null>(null);
  const [finetuneFilter, setFinetuneFilter] = useState<FinetuneFilter>('all');

  // Function to get actual image dimensions
  const getImageDimensions = useCallback((imageUrl: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        // Fallback to 512x512 if image fails to load
        console.warn(`Failed to load image dimensions for: ${imageUrl}`);
        resolve({ width: 512, height: 512 });
      };
      img.src = imageUrl;
    });
  }, []);

  const saveGalleryToStorage = (images: GalleryImage[]) => {
    try {
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(images));
    } catch (error) {
      console.error('Failed to save gallery to localStorage:', error);
    }
  };

  const loadGalleryFromStorage = (): GalleryImage[] => {
    try {
      const stored = localStorage.getItem(GALLERY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load gallery from localStorage:', error);
      return [];
    }
  };

  const saveGalleryChanges = useCallback(async (images: GalleryImage[]) => {
    saveGalleryToStorage(images);
    
    try {
      const metadataEntries = images.map(img => ({
        fileName: img.localUrl?.split('/images/')[1] || `unknown-${img.timestamp}`,
        url: img.url,
        localUrl: img.localUrl || img.url,
        width: img.width,
        height: img.height,
        prompt: img.prompt,
        seed: img.seed,
        modelUsed: img.modelUsed,
        finetuneId: img.finetuneId,
        timestamp: img.timestamp
      }));
      
      await fetch('/api/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metadata: metadataEntries }),
      });
      
      console.log(`Saved ${metadataEntries.length} metadata entries to file`);
    } catch (error) {
      console.error("Failed to save metadata to file:", error);
    }
  }, []);

  const loadCompleteGallery = useCallback(async () => {
    try {
      console.log("Loading gallery from all sources...");
      
      // Load from all sources in parallel
      const [scanResponse, metadataResponse, cachedImages] = await Promise.all([
        fetch('/api/scan-images'),
        fetch('/api/metadata'),
        imageCache.getCachedImages()
      ]);
      
      const scanData = await scanResponse.json();
      const fileSystemImages: ImageFileInfo[] = scanData.success ? scanData.images : [];
      
      const metadataData = await metadataResponse.json();
      const persistedMetadata = metadataData.success ? metadataData.metadata : [];
      
      const localStorageImages = loadGalleryFromStorage();
      
      const metadataMap = new Map<string, ImageMetadata>();
      const cachedImageMap = new Map<string, CachedImage>();
      
      // Build metadata map
      persistedMetadata.forEach((meta: ImageMetadata) => {
        metadataMap.set(meta.fileName, meta);
      });
      
      localStorageImages.forEach((img: GalleryImage) => {
        const fileName = img.localUrl?.split('/images/')[1];
        if (fileName && !metadataMap.has(fileName)) {
          metadataMap.set(fileName, {
            fileName,
            url: img.url,
            localUrl: img.localUrl || img.url,
            width: img.width,
            height: img.height,
            prompt: img.prompt,
            seed: img.seed,
            modelUsed: img.modelUsed,
            finetuneId: img.finetuneId,
            timestamp: img.timestamp
          });
        }
      });
      
      // Build cached images map
      cachedImages.forEach((cached: CachedImage) => {
        cachedImageMap.set(cached.id, cached);
      });
      
      const finalGallery: GalleryImage[] = [];
      
      // Process filesystem images first
      for (const fileInfo of fileSystemImages) {
        const metadata = metadataMap.get(fileInfo.fileName);
        
        if (metadata && metadata.width && metadata.height && metadata.width !== 512 && metadata.height !== 512) {
          // Use existing metadata if it has proper dimensions
          finalGallery.push({
            url: metadata.url || fileInfo.localUrl,
            localUrl: fileInfo.localUrl,
            width: metadata.width,
            height: metadata.height,
            prompt: metadata.prompt || "Generated image",
            seed: metadata.seed || 0,
            modelUsed: metadata.modelUsed,
            finetuneId: metadata.finetuneId,
            timestamp: metadata.timestamp || fileInfo.lastModified
          });
        } else {
          // Get actual image dimensions for missing or fallback metadata
          console.log(`Getting actual dimensions for: ${fileInfo.fileName}`);
          const dimensions = await getImageDimensions(fileInfo.localUrl);
          
          finalGallery.push({
            url: metadata?.url || fileInfo.localUrl,
            localUrl: fileInfo.localUrl,
            width: dimensions.width,
            height: dimensions.height,
            prompt: metadata?.prompt || "Generated image (no metadata)",
            seed: metadata?.seed || 0,
            modelUsed: metadata?.modelUsed || "Unknown",
            finetuneId: metadata?.finetuneId,
            timestamp: metadata?.timestamp || fileInfo.lastModified
          });
        }
      }
      
      // Add cached images that aren't yet downloaded
      for (const cached of cachedImages) {
        const isAlreadyDownloaded = finalGallery.some(img => 
          img.seed === cached.metadata.seed && 
          Math.abs(img.timestamp - cached.metadata.timestamp) < 5000 // Within 5 seconds
        );
        
        if (!isAlreadyDownloaded) {
          console.log(`Adding cached image to gallery: ${cached.id} (status: ${cached.downloadStatus})`);
          finalGallery.push({
            url: cached.url,
            localUrl: cached.localUrl || URL.createObjectURL(cached.blob),
            width: cached.metadata.width,
            height: cached.metadata.height,
            prompt: cached.metadata.prompt,
            seed: cached.metadata.seed,
            modelUsed: cached.metadata.modelUsed,
            finetuneId: cached.metadata.finetuneId,
            timestamp: cached.metadata.timestamp,
            downloadStatus: cached.downloadStatus
          });
        }
      }
      
      console.log(`Loaded gallery: ${fileSystemImages.length} files, ${persistedMetadata.length} metadata entries, ${cachedImages.length} cached images, ${finalGallery.length} final images`);
      
      setAllGeneratedImages(finalGallery);
      setIsLoadingGallery(false);
      
      if (finalGallery.length > 0) {
        setGalleryLoadedMessage(
          `Gallery loaded: ${finalGallery.length} images (${fileSystemImages.length} files, ${cachedImages.length} cached)`
        );
        setTimeout(() => setGalleryLoadedMessage(null), 5000);
      }
      
      // Clean up old cached images (older than 7 days)
      imageCache.clearOldCache().catch(console.error);
      
    } catch (error) {
      console.error("Error loading gallery:", error);
      const savedImages = loadGalleryFromStorage();
      setAllGeneratedImages(savedImages);
      setIsLoadingGallery(false);
      
      if (savedImages.length > 0) {
        setGalleryLoadedMessage(`Loaded ${savedImages.length} images from localStorage (file sync failed)`);
        setTimeout(() => setGalleryLoadedMessage(null), 3000);
      }
    }
  }, [getImageDimensions]);

  const addImagesToGallery = useCallback((newImages: GalleryImage[]) => {
    console.log(`Adding ${newImages.length} new images to gallery`);
    setAllGeneratedImages(prev => {
      const updated = [...newImages, ...prev];
      console.log(`Gallery now has ${updated.length} total images`);
      return updated;
    });
  }, []);

  useEffect(() => {
    loadCompleteGallery();
  }, [loadCompleteGallery]);

  useEffect(() => {
    if (!isLoadingGallery && allGeneratedImages.length > 0) {
      saveGalleryChanges(allGeneratedImages);
    }
  }, [allGeneratedImages, isLoadingGallery, saveGalleryChanges]);

  const refreshGallery = useCallback(() => {
    console.log("Manually refreshing gallery...");
    setIsLoadingGallery(true);
    loadCompleteGallery();
  }, [loadCompleteGallery]);

  // Enhanced helper to determine finetune type from image data
  const getFinetuneTypeFromImage = useCallback((image: GalleryImage): FinetuneFilter => {
    // NEW: If we have finetuneId stored (for newer images), use that directly
    if (image.finetuneId) {
      // Map finetune_id to filter type using FINETUNE_CONFIGS
      const config = FINETUNE_CONFIGS.find(c => c.id === image.finetuneId);
      if (config) {
        if (config.name === 'brawler') return 'brawler';
        if (config.name === 'prop') return 'prop';
        if (config.id === 'none') return 'none';
      }
      // If finetuneId doesn't match known configs, fall through to other methods
    }
    
    // FALLBACK: For older images without finetuneId, use existing logic
    
    // First check if it's explicitly a regular model
    if (image.modelUsed === "fal-ai/flux-pro/v1.1") {
      return 'none';
    }
    
    // For any image (including those with finetuned model endpoint), check prompt for trigger words
    const prompt = image.prompt.toLowerCase().trim();
    
    // Check each finetune config for trigger word matches
    for (const config of FINETUNE_CONFIGS) {
      if (config.triggerWord && config.triggerWord.trim() !== "") {
        const triggerWord = config.triggerWord.toLowerCase();
        
        // Check if trigger word appears as a whole word (not part of another word)
        const wordBoundaryRegex = new RegExp(`\\b${triggerWord}\\b`, 'i');
        if (wordBoundaryRegex.test(prompt)) {
          // Map the config name to our filter type
          if (config.name === 'brawler') return 'brawler';
          if (config.name === 'prop') return 'prop';
        }
      }
    }
    
    // If no trigger words found, determine based on model endpoint
    if (image.modelUsed === "fal-ai/flux-pro/v1.1-ultra-finetuned") {
      // It's a finetuned model but no trigger word detected
      // This might be an older image or one with a modified prompt
      console.warn(`Finetuned model detected but no trigger word found in prompt: "${image.prompt}"`);
      return 'none'; // Default to none for safety
    }
    
    // Default to regular FLUX for any other case
    return 'none';
  }, []);

  // Filter images based on selected finetune filter
  const filteredImages = useCallback(() => {
    if (finetuneFilter === 'all') {
      return allGeneratedImages;
    }
    
    return allGeneratedImages.filter(image => {
      const imageType = getFinetuneTypeFromImage(image);
      return imageType === finetuneFilter;
    });
  }, [allGeneratedImages, finetuneFilter, getFinetuneTypeFromImage]);

  // Get filter statistics for debugging
  const getFilterStats = useCallback(() => {
    const stats = {
      all: allGeneratedImages.length,
      none: 0,
      brawler: 0,
      prop: 0
    };
    
    allGeneratedImages.forEach(image => {
      const type = getFinetuneTypeFromImage(image);
      stats[type]++;
    });
    
    return stats;
  }, [allGeneratedImages, getFinetuneTypeFromImage]);

  // Log filter stats when images change (for debugging)
  useEffect(() => {
    if (!isLoadingGallery && allGeneratedImages.length > 0) {
      const stats = getFilterStats();
      console.log('Gallery Filter Stats:', stats);
      
      // Log some examples for debugging
      const examples = allGeneratedImages.slice(0, 3).map(img => ({
        prompt: img.prompt.substring(0, 50) + '...',
        modelUsed: img.modelUsed,
        finetuneId: img.finetuneId || 'not stored',
        detectedType: getFinetuneTypeFromImage(img),
        detectionMethod: img.finetuneId ? 'finetuneId' : 'trigger word'
      }));
      console.log('Example detections:', examples);
    }
  }, [allGeneratedImages, isLoadingGallery, getFilterStats, getFinetuneTypeFromImage]);

  return {
    allGeneratedImages,
    isLoadingGallery,
    galleryLoadedMessage,
    addImagesToGallery,
    refreshGallery,
    sortedGalleryImages: [...allGeneratedImages].sort((a, b) => b.timestamp - a.timestamp),
    filteredImages: [...filteredImages()].sort((a, b) => b.timestamp - a.timestamp),
    finetuneFilter,
    setFinetuneFilter,
    getFilterStats
  };
}; 