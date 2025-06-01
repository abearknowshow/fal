export interface EditorLayer {
  id: string;
  name: string;
  imageUrl: string;
  originalUrl?: string; // Original fal.media URL for API calls
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  isBackground?: boolean;
  hasTransparency?: boolean;
  perspectiveTransform?: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
  };
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtendArea {
  x: number;
  y: number;
  width: number;
  height: number;
  originalX: number;
  originalY: number;
  originalWidth: number;
  originalHeight: number;
}

export interface ExtendOptions {
  extendArea: ExtendArea;
  prompt?: string;
}

export interface EditorTool {
  id: string;
  name: string;
  icon: string;
  active: boolean;
}

export interface EditorState {
  currentTool: string;
  layers: EditorLayer[];
  activeLayerId: string | null;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  cropArea: CropArea | null;
  isProcessing: boolean;
  history: EditorHistoryState[];
  historyIndex: number;
}

export interface EditorHistoryState {
  layers: EditorLayer[];
  canvasWidth: number;
  canvasHeight: number;
  timestamp: number;
}

export interface BackgroundRemovalResult {
  imageUrl: string;
  maskUrl?: string;
}

export interface ImageExtensionResult {
  imageUrl: string;
  newWidth: number;
  newHeight: number;
  model?: string;
  success?: boolean;
}

export const EDITOR_TOOLS = {
  SELECT: 'select',
  CROP: 'crop',
  EXTEND: 'extend',
  BACKGROUND_REMOVAL: 'background-removal',
  SMART_SELECT: 'smart-select',
  LAYER: 'layer',
  CANVAS: 'canvas',
  PERSPECTIVE: 'perspective'
} as const;

export interface AspectRatio {
  id: string;
  name: string;
  ratio: number;
  width?: number;
  height?: number;
}

export const ASPECT_RATIOS: AspectRatio[] = [
  { id: 'free', name: 'Free', ratio: 0 },
  { id: '1:1', name: '1:1 (Square)', ratio: 1 },
  { id: '4:3', name: '4:3 (Standard)', ratio: 4/3 },
  { id: '3:4', name: '3:4 (Portrait)', ratio: 3/4 },
  { id: '16:9', name: '16:9 (Widescreen)', ratio: 16/9 },
  { id: '9:16', name: '9:16 (Story)', ratio: 9/16 },
  { id: '3:2', name: '3:2 (Photo)', ratio: 3/2 },
  { id: '2:3', name: '2:3 (Photo Portrait)', ratio: 2/3 },
  { id: 'custom', name: 'Custom', ratio: -1 }
];

export interface CanvasResizeOptions {
  width: number;
  height: number;
  aspectRatio?: AspectRatio;
  maintainCenter?: boolean;
  scaleContent?: boolean;
}

 