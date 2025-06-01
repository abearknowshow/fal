# Image Editor Documentation

## Overview

The Image Editor is a full-screen, comprehensive image editing tool integrated into the gallery modal. It provides advanced editing capabilities including cropping, canvas extension, background removal, and layering with composition features.

## Features

### 🎯 Core Tools

1. **Crop Tool**
   - Interactive crop selection with draggable handles
   - Real-time preview with overlay
   - Precise dimension display
   - Keyboard shortcuts support

2. **Extend Tool**
   - Interactive crop-like interface for canvas extension
   - Drag handles to extend in any direction (top, bottom, left, right, corners)
   - Visual preview of extension areas with blue highlighting
   - Real-time feedback showing extension amounts
   - AI-powered content generation for extended areas
   - Optional custom prompts for generation
   - Intuitive drag-to-extend workflow

3. **Background Removal**
   - One-click background removal using AI
   - Automatic transparency preservation
   - High-quality subject isolation

4. **Layering System**
   - Multi-layer composition
   - Drag-and-drop layer positioning
   - Layer visibility controls
   - Opacity adjustment
   - Scale and rotation controls
   - Horizontal flip functionality
   - Layer deletion (except background layer)

### 🎨 Layer Management

- **Layer Properties Panel**: Right sidebar with comprehensive controls
- **Layer Thumbnails**: Visual representation of each layer
- **Active Layer Selection**: Click to select and edit layers
- **Transform Controls**: Position, size, scale, rotation, and flip
- **Import Functionality**: Add new images as layers

### ⌨️ Keyboard Shortcuts

- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Shift + Z`: Redo
- `Ctrl/Cmd + S`: Save edited image
- `Escape`: Close editor

### 🔄 History System

- Unlimited undo/redo functionality
- Automatic state saving for major operations
- History navigation with visual indicators

### Real Image Extension (NEW!)

The image extension feature now uses real AI models to extend images beyond their original borders with high-quality results.

#### Supported Models

1. **Bria Expand** (Primary)
   - Professional-grade outpainting model
   - Trained on licensed data for commercial use
   - Excellent for extending backgrounds naturally
   - Supports custom prompts for guided extension

2. **Ideogram V3 Reframe** (Fallback)
   - High-quality image reframing and extension
   - Strong prompt adherence for creative directions
   - Good for artistic and stylized extensions

#### API Endpoint: `/api/extend-image`

**Request:**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "direction": "right",
  "amount": 200,
  "prompt": "extend the background naturally"
}
```

**Response:**
```json
{
  "imageUrl": "https://fal.media/files/...",
  "newWidth": 1224,
  "newHeight": 768,
  "model": "bria-expand",
  "success": true
}
```

#### Parameters

- `imageUrl` (required): Image to extend - supports:
  - **Remote URLs**: `https://example.com/image.jpg`
  - **Local paths**: `/images/my-image.png` (from public directory)
  - **Data URIs**: `data:image/png;base64,iVBORw0KGgo...` (base64 encoded)
- `direction` (required): Extension direction - "top", "bottom", "left", or "right"
- `amount` (required): Extension amount in pixels (1-2000)
- `prompt` (optional): Text description to guide the extension

#### Features

- **Universal Image Support**: Handles remote URLs, local files, and base64 data
- **Automatic Upload**: Local files and data URIs are automatically uploaded to FAL storage
- **Automatic Model Fallback**: If the primary model fails, automatically tries alternative models
- **Smart Canvas Calculation**: Automatically calculates new canvas size and image positioning
- **Comprehensive Validation**: Validates all input parameters with helpful error messages
- **Error Handling**: Specific error handling for rate limits, validation errors, and API failures
- **Logging**: Detailed logging for debugging and monitoring

#### Usage in Editor

1. Select the Extend tool from the toolbar
2. Choose extension direction (top, bottom, left, right)
3. Set extension amount using presets or custom value
4. Optionally add a prompt to guide the extension
5. Click "Extend" to process

#### Technical Implementation

The extension system:
- **Real Image Dimension Detection**: Automatically detects actual image dimensions from URLs, local files, and data URIs
- **Image Optimization**: Intelligent scaling for optimal processing (256px minimum, 2048px maximum)
- **Universal Image Support**: Handles remote URLs, local files, and base64 data
- **Automatic Upload**: Local files and data URIs are automatically uploaded to FAL storage
- **Smart Processing**: Uses actual image dimensions instead of defaults for accurate extension calculations
- **Enhanced Progress Tracking**: Real-time progress indicators with estimated completion times
- **Automatic Model Fallback**: If the primary model fails, automatically tries alternative models
- **Smart Canvas Calculation**: Automatically calculates new canvas size and image positioning
- **Comprehensive Validation**: Validates all input parameters with helpful error messages
- **Error Handling**: Specific error handling for rate limits, validation errors, and API failures
- **Detailed Logging**: Comprehensive logging for debugging and monitoring

#### Enhanced User Experience

- **Visual Extension Preview**: Blue overlay shows exactly what areas will be generated
- **Real-time Dimension Display**: Shows extension amounts and final image size
- **Processing Time Estimation**: Calculates estimated processing time based on extension area
- **Progress Indicators**: Animated progress bar with remaining time countdown
- **Interactive Handles**: Drag handles to precisely control extension areas
- **Smart Prompting**: Optional custom prompts to guide AI generation
- **Responsive UI**: All controls adapt to processing state

#### Future Enhancements

- **Batch Processing**: Support for extending multiple images
- **Custom Masks**: User-defined extension areas
- **Quality Settings**: Speed vs quality trade-offs
- **Preview Generation**: Quick preview before processing

## Usage

### Accessing the Editor

1. Open the gallery page
2. Click on any image to open the modal
3. Click the "Edit" button in the modal header
4. The full-screen editor will launch

### Basic Workflow

1. **Select a Tool**: Use the left toolbar to choose your editing tool
2. **Edit the Image**: Apply your desired modifications
3. **Manage Layers**: Use the right panel to control layers
4. **Save**: Click the save button or use Ctrl/Cmd + S

### Primary Use Case: Background Extension + Character Composition

This editor is optimized for the workflow of:
1. Extending one image's background using the Extend tool
2. Removing the background from a character image
3. Importing the isolated character as a new layer
4. Positioning and scaling the character on the extended background

## Technical Implementation

### Architecture

```
src/components/
├── ImageEditor.tsx          # Main editor component
├── editor/
│   ├── EditorCanvas.tsx     # Canvas rendering and interaction
│   ├── EditorToolbar.tsx    # Left sidebar tools
│   ├── LayerPanel.tsx       # Right sidebar layer management
│   ├── CropTool.tsx         # Crop tool overlay
│   └── ExtendTool.tsx       # Extension tool modal
└── types/
    └── image-editor.ts      # TypeScript definitions
```

### API Endpoints

- `POST /api/extend-image`: Canvas extension with AI generation
- `POST /api/remove-background`: Background removal using BiRefNet

### State Management

The editor uses React state with a comprehensive history system:

```typescript
interface EditorState {
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
```

## Integration

### Gallery Integration

The editor is seamlessly integrated with the existing gallery:
- Edit button appears in the image modal
- Edited images can be saved back to the gallery
- Maintains consistency with the existing UI design

### FAL AI Integration

- Uses existing FAL AI infrastructure
- Leverages FLUX models for image extension
- BiRefNet model for background removal
- Consistent with existing generation pipeline

## Performance Considerations

- Canvas-based rendering for optimal performance
- Lazy loading of editor components
- Efficient state updates with React optimization
- Background processing for AI operations

## Future Enhancements

Potential improvements for future versions:
- Additional filters and effects
- Brush tools for manual editing
- Text overlay capabilities
- Batch processing
- Cloud save functionality
- Collaborative editing features

## Dependencies

The editor relies on:
- React 19+ with hooks
- Next.js 15+ for API routes
- FAL AI client for AI operations
- Tailwind CSS for styling
- Lucide React for icons
- TypeScript for type safety

## Browser Compatibility

- Modern browsers with Canvas API support
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Mobile browsers with touch support for layer manipulation 

## Development

### Environment Variables

```bash
FAL_KEY=your_fal_api_key_here
```

### API Models Used

- `fal-ai/bria/expand` - Primary extension model
- `fal-ai/ideogram/v3/reframe` - Fallback extension model
- `fal-ai/birefnet` - Background removal
- `fal-ai/flux-pro/v1.1` - Image generation

### Error Handling

The API provides specific error codes:
- `400`: Invalid parameters
- `422`: Model validation errors
- `429`: Rate limit exceeded
- `500`: Server errors

### Cost Considerations

Image extension costs vary by model:
- Bria Expand: ~$0.04 per generation
- Ideogram Reframe: ~$0.03-0.09 depending on quality setting

## Contributing

When adding new features:
1. Follow the existing code structure
2. Add comprehensive error handling
3. Include detailed logging
4. Update type definitions
5. Document new functionality 