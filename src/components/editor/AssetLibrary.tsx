"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Grid3X3, 
  List, 
  Plus, 
  Clock, 
  Star,
  ImageIcon
} from "lucide-react";
import { GalleryImage } from "@/types/image-generation";

interface AssetLibraryProps {
  onAddAsset: (imageUrl: string, name: string) => void;
  isCollapsed?: boolean;
}

type ViewMode = 'grid' | 'list';
type FilterMode = 'all' | 'recent' | 'favorites';

export function AssetLibrary({ onAddAsset, isCollapsed = false }: AssetLibraryProps) {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load gallery images
  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        const response = await fetch('/api/metadata');
        if (response.ok) {
          const data = await response.json();
          setGalleryImages(data.images || []);
        }
      } catch (error) {
        console.error('Failed to load gallery images:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGalleryImages();
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('editor-favorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  // Save favorites to localStorage
  const toggleFavorite = (imageUrl: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(imageUrl)) {
      newFavorites.delete(imageUrl);
    } else {
      newFavorites.add(imageUrl);
    }
    setFavorites(newFavorites);
    localStorage.setItem('editor-favorites', JSON.stringify([...newFavorites]));
  };

  // Filter and search images
  const filteredImages = galleryImages
    .filter(image => {
      // Apply filter mode
      switch (filterMode) {
        case 'recent':
          const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          return image.timestamp > oneWeekAgo;
        case 'favorites':
          return favorites.has(image.url);
        default:
          return true;
      }
    })
    .filter(image => {
      // Apply search query
      if (!searchQuery) return true;
      return image.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (image.modelUsed && image.modelUsed.toLowerCase().includes(searchQuery.toLowerCase()));
    })
    .sort((a, b) => b.timestamp - a.timestamp); // Most recent first

  const handleAddAsset = (image: GalleryImage) => {
    const imageUrl = image.localUrl || image.url;
    const name = `Gallery Image ${new Date(image.timestamp).toLocaleDateString()}`;
    onAddAsset(imageUrl, name);
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-muted border-l border-border flex flex-col items-center py-4">
        <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-muted border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Asset Library</h3>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'grid' ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="w-8 h-8 p-0"
            >
              <Grid3X3 className="h-3 w-3" />
            </Button>
            <Button
              variant={viewMode === 'list' ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode('list')}
              className="w-8 h-8 p-0"
            >
              <List className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1">
          <Button
            variant={filterMode === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterMode('all')}
            className="flex-1 h-7 text-xs"
          >
            All
          </Button>
          <Button
            variant={filterMode === 'recent' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterMode('recent')}
            className="flex-1 h-7 text-xs"
          >
            <Clock className="h-3 w-3 mr-1" />
            Recent
          </Button>
          <Button
            variant={filterMode === 'favorites' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterMode('favorites')}
            className="flex-1 h-7 text-xs"
          >
            <Star className="h-3 w-3 mr-1" />
            Starred
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-1">
              {searchQuery || filterMode !== 'all' ? 'No images found' : 'No images in gallery'}
            </p>
            <p className="text-xs text-muted-foreground">
              {searchQuery || filterMode !== 'all' ? 'Try adjusting your search or filters' : 'Generate some images first'}
            </p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-2 gap-3" 
              : "space-y-2"
          }>
            {filteredImages.map((image, index) => (
              <Card 
                key={`${image.url}-${index}`} 
                className={`group cursor-pointer transition-all duration-200 hover:shadow-md ${
                  viewMode === 'grid' ? 'aspect-square' : 'aspect-[2/1]'
                }`}
              >
                <div className="relative w-full h-full">
                  <img
                    src={image.localUrl || image.url}
                    alt={`Generated: ${image.prompt.substring(0, 50)}...`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  
                  {/* Overlay with controls */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddAsset(image);
                        }}
                        className="bg-white text-black hover:bg-gray-100"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(image.url);
                        }}
                        className="bg-white border-white text-black hover:bg-gray-100"
                      >
                        <Star className={`h-3 w-3 ${favorites.has(image.url) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  {/* Image info for list view */}
                  {viewMode === 'list' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 rounded-b-lg">
                      <p className="text-white text-xs font-medium truncate">
                        {image.prompt.substring(0, 60)}...
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-white/70 text-xs">
                          {new Date(image.timestamp).toLocaleDateString()}
                        </span>
                        {image.modelUsed && (
                          <span className="text-white/70 text-xs bg-white/20 px-2 py-0.5 rounded">
                            {image.modelUsed.includes('brawler') ? 'Brawler' : 
                             image.modelUsed.includes('prop') ? 'Prop' : 'FLUX'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Favorite indicator for grid view */}
                  {viewMode === 'grid' && favorites.has(image.url) && (
                    <div className="absolute top-2 right-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          {filteredImages.length} of {galleryImages.length} images
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      </div>
    </div>
  );
}