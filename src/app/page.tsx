"use client";

import { useState } from "react";
import { useGallery } from "@/hooks/useGallery";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { useImageModal } from "@/hooks/useImageModal";
import ImageGenerationForm from "@/components/ImageGenerationForm";
import ResultsContainer from "@/components/ResultsContainer";
import ImageModal from "@/components/ImageModal";

export default function Home() {
  const [showGallery, setShowGallery] = useState(false);
  
  // Custom hooks for state management
  const {
    isLoadingGallery,
    galleryLoadedMessage,
    addImagesToGallery,
    refreshGallery,
    sortedGalleryImages
  } = useGallery();

  const {
    formData,
    isGenerating,
    result,
    error,
    downloadErrors,
    handleInputChange,
    generateImage,
    clearDownloadErrors,
    setFormData
  } = useImageGeneration();

  const {
    expandedImage,
    expandedImageIndex,
    openModal,
    closeModal,
    navigateImage
  } = useImageModal(sortedGalleryImages);

  // Handle image generation with gallery update
  const handleGenerate = () => {
    generateImage(addImagesToGallery);
  };

  // Toggle between gallery and current results
  const toggleGallery = () => {
    setShowGallery(!showGallery);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Generate Images
          </h1>
         
        </div>

        <div className="grid gap-6 md:grid-cols-2 items-start">
          {/* Form */}
          <ImageGenerationForm
            formData={formData}
            isGenerating={isGenerating}
            onInputChange={handleInputChange}
            onGenerate={handleGenerate}
            onFormDataChange={setFormData}
          />

          {/* Results */}
          <ResultsContainer
            showGallery={showGallery}
            sortedGalleryImages={sortedGalleryImages}
            isLoadingGallery={isLoadingGallery}
            galleryLoadedMessage={galleryLoadedMessage}
            downloadErrors={downloadErrors}
            result={result}
            isGenerating={isGenerating}
            error={error}
            onToggleGallery={toggleGallery}
            onImageClick={openModal}
            onClearErrors={clearDownloadErrors}
            onRefreshGallery={refreshGallery}
          />
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        image={expandedImage}
        images={sortedGalleryImages}
        currentIndex={expandedImageIndex}
        onClose={closeModal}
        onNavigate={navigateImage}
      />
    </div>
  );
}
