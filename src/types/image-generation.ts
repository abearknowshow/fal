export interface GeneratedImage {
  url: string;
  width: number;
  height: number;
  content_type: string;
}

export interface GenerationResult {
  images: GeneratedImage[];
  prompt: string;
  seed: number;
  has_nsfw_concepts: boolean[];
  modelUsed?: string;
  finetuneId?: string;
}

export interface FinetuneConfig {
  id: string;
  name: string;
  triggerWord: string;
  description?: string;
}

export interface GalleryImage {
  url: string;
  localUrl?: string;
  width: number;
  height: number;
  prompt: string;
  seed: number;
  modelUsed?: string;
  finetuneId?: string;
  timestamp: number;
  downloadStatus?: 'pending' | 'downloading' | 'completed' | 'failed' | 'cached';
}

export interface ImageFileInfo {
  fileName: string;
  localUrl: string;
  fileSize: number;
  lastModified: number;
}

export interface ImageMetadata {
  fileName: string;
  url: string;
  localUrl: string;
  width: number;
  height: number;
  prompt: string;
  seed: number;
  modelUsed?: string;
  finetuneId?: string;
  timestamp: number;
}

export interface FormData {
  prompt: string;
  seed: string;
  num_images: number;
  enable_safety_checker: boolean;
  safety_tolerance: string;
  output_format: string;
  aspect_ratio: string;
  raw: boolean;
  finetune_id: string;
  finetune_strength: number;
}

export const FINETUNE_CONFIGS: FinetuneConfig[] = [
  {
    id: "none",
    name: "None (Regular FLUX1.1 [pro])",
    triggerWord: "",
    description: "Use the standard FLUX1.1 [pro] model"
  },
  {
    id: "ea3f8df2-0282-4566-84f7-7ba0c4f2c618",
    name: "brawler",
    triggerWord: "brawler",
    description: "Trigger word: brawler"
  },
  {
    id: "2fe41892-0bc7-4faa-85d6-4a82b86b3e9f",
    name: "prop",
    triggerWord: "prop",
    description: "Trigger word: prop"
  }
];

export const GALLERY_STORAGE_KEY = 'fal-image-gallery'; 