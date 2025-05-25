import { useState, useCallback } from 'react';
import { GalleryImage } from '@/types/image-generation';

export const useImageModal = (images: GalleryImage[]) => {
  const [expandedImage, setExpandedImage] = useState<GalleryImage | null>(null);
  const [expandedImageIndex, setExpandedImageIndex] = useState<number>(0);

  const openModal = useCallback((image: GalleryImage, index: number) => {
    setExpandedImage(image);
    setExpandedImageIndex(index);
  }, []);

  const closeModal = useCallback(() => {
    setExpandedImage(null);
  }, []);

  const navigateImage = useCallback((direction: 'prev' | 'next') => {
    if (!expandedImage || images.length === 0) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = expandedImageIndex > 0 ? expandedImageIndex - 1 : images.length - 1;
    } else {
      newIndex = expandedImageIndex < images.length - 1 ? expandedImageIndex + 1 : 0;
    }
    
    setExpandedImageIndex(newIndex);
    setExpandedImage(images[newIndex]);
  }, [expandedImage, expandedImageIndex, images]);

  return {
    expandedImage,
    expandedImageIndex,
    openModal,
    closeModal,
    navigateImage
  };
}; 