"use client";

import { useGallery, type FinetuneFilter } from "@/hooks/useGallery";
import { useImageModal } from "@/hooks/useImageModal";
import ImageGallery from "@/components/ImageGallery";
import ImageModal from "@/components/ImageModal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RefreshCw, Filter } from "lucide-react";

export default function GalleryPage() {
  const {
    isLoadingGallery,
    filteredImages,
    refreshGallery,
    finetuneFilter,
    setFinetuneFilter,
    getFilterStats
  } = useGallery();

  const {
    expandedImage,
    expandedImageIndex,
    openModal,
    closeModal,
    navigateImage
  } = useImageModal(filteredImages);

  const filterStats = getFilterStats();
  const filterOptions = [
    { value: 'all', label: `All Models (${filterStats.all})` },
    { value: 'none', label: `Regular FLUX (${filterStats.none})` },
    { value: 'brawler', label: `Brawler (${filterStats.brawler})` },
    { value: 'prop', label: `Prop (${filterStats.prop})` }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Image Gallery
          </h1>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <Label htmlFor="finetune-filter" className="text-sm font-medium">
                Filter by Model:
              </Label>
                             <Select value={finetuneFilter} onValueChange={(value) => setFinetuneFilter(value as FinetuneFilter)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Refresh Button */}
            <Button
              onClick={refreshGallery}
              disabled={isLoadingGallery}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingGallery ? 'animate-spin' : ''}`} />
              {isLoadingGallery ? 'Refreshing...' : 'Refresh Gallery'}
            </Button>
          </div>

          {/* Results count */}
          {!isLoadingGallery && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Showing {filteredImages.length} images
              {finetuneFilter !== 'all' && (
                <span> • Filtered by: {filterOptions.find(opt => opt.value === finetuneFilter)?.label}</span>
              )}
            </p>
          )}
        </div>

        {/* Gallery Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <ImageGallery
            images={filteredImages}
            isLoading={isLoadingGallery}
            downloadErrors={[]} // No download errors on gallery page
            onImageClick={openModal}
            onClearErrors={() => {}} // No-op since no errors
          />
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        image={expandedImage}
        images={filteredImages}
        currentIndex={expandedImageIndex}
        onClose={closeModal}
        onNavigate={navigateImage}
      />
    </div>
  );
} 