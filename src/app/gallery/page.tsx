"use client";

import { useState } from "react";
import { useGallery, type FinetuneFilter } from "@/hooks/useGallery";
import { useImageModal } from "@/hooks/useImageModal";
import ImageGallery from "@/components/ImageGallery";
import ImageModal from "@/components/ImageModal";
import ImageEditor from "@/components/ImageEditor";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RefreshCw, Filter } from "lucide-react";
import { GalleryImage } from "@/types/image-generation";

export default function GalleryPage() {
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  
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

  const handleEditImage = (image: GalleryImage) => {
    setEditingImage(image);
    closeModal(); // Close the modal when opening editor
  };

  const handleCloseEditor = () => {
    setEditingImage(null);
  };

  const handleSaveEditedImage = (editedImageUrl: string) => {
    // Here you could save the edited image to the gallery
    // For now, we'll just close the editor
    console.log('Edited image saved:', editedImageUrl);
    setEditingImage(null);
  };

  const filterStats = getFilterStats();
  const filterOptions = [
    { value: 'all', label: `All Models (${filterStats.all})` },
    { value: 'none', label: `Regular FLUX (${filterStats.none})` },
    { value: 'brawler', label: `Brawler (${filterStats.brawler})` },
    { value: 'prop', label: `Prop (${filterStats.prop})` }
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Image Gallery
          </h1>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
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
            <p className="text-sm text-muted-foreground mt-2">
              Showing {filteredImages.length} images
              {finetuneFilter !== 'all' && (
                <span> • Filtered by: {filterOptions.find(opt => opt.value === finetuneFilter)?.label}</span>
              )}
            </p>
          )}
        </div>

        {/* Gallery Content */}
                  <div className="bg-card rounded-lg shadow-sm border border-border p-6">
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
        onEdit={handleEditImage}
      />

      {/* Image Editor */}
      {editingImage && (
        <ImageEditor
          image={editingImage}
          onClose={handleCloseEditor}
          onSave={handleSaveEditedImage}
        />
      )}
    </div>
  );
} 