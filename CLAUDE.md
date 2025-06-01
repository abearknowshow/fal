# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (uses Turbopack)
- `npm run build` - Build production application  
- `npm run lint` - Run ESLint checks
- `npm start` - Start production server

## Environment Setup

Required environment variables in `.env.local`:
```
FAL_KEY=your_fal_api_key_here
KLING_API_KEY=your_kling_api_key_here
```

## Technology Stack

- **Next.js 15** with App Router and Turbopack for development
- **React 19** with modern hooks and component patterns
- **TypeScript** for type safety throughout the application
- **Tailwind CSS** for utility-first styling with dark mode support
- **shadcn/ui** components built on Radix UI primitives
- **Fal AI Client** (@fal-ai/client) for AI model integration
- **Lucide React** for consistent iconography

## Architecture Overview

This is a Next.js 15 application built with the App Router that provides AI-powered image generation and editing using Fal AI's FLUX models.

### Core Structure

**Image Generation Flow:**
- User submits form (`ImageGenerationForm.tsx`) → API route (`/api/generate-image`) → Fal AI FLUX models → Results stored locally and displayed

**Image Gallery System:**
- Images stored in `public/images/` directory with metadata in `public/gallery-metadata.json`
- Gallery state managed via `useGallery.ts` hook with local storage persistence
- Modal view (`ImageModal.tsx`) provides full-size viewing and editing access

**Image Editor:**
- Full-screen canvas-based editor accessible from gallery modal
- Multi-layer composition system with crop, extend, and background removal tools
- Real AI-powered image extension using Bria Expand and Ideogram models
- State management with undo/redo history system

### API Architecture

**Generation Models:**
- Regular FLUX: `fal-ai/flux-pro/v1.1` (maps aspect ratios to image_size)
- Fine-tuned FLUX: `fal-ai/flux-pro/v1.1-ultra-finetuned` (uses aspect_ratio directly)
- Model selection based on `finetune_id` parameter

**Complete API Endpoints:**

**`POST /api/generate-image`** - Primary image generation
- Accepts prompt, model settings, finetune configuration
- Auto-selects between regular and fine-tuned FLUX models
- Returns generated images with metadata

**`POST /api/extend-image`** - AI-powered canvas extension
- Models: Bria Expand (primary), Ideogram Reframe (fallback)
- Supports: remote URLs, local paths (`/images/file.jpg`), data URIs (base64)
- Automatic image dimension detection using `image-size` library
- Auto-uploads local/base64 images to FAL storage
- Smart canvas calculation and coordinate positioning
- Model fallback system for reliability
- Comprehensive validation and error handling

**`POST /api/remove-background`** - Background removal 
- Uses `fal-ai/birefnet` model for subject isolation
- Returns transparent PNG with background removed

**`POST /api/generate-video`** - Video generation from images
- Uses Kling AI API for image-to-video conversion
- Supports multiple durations (5s, 10s), aspect ratios, motion levels
- Model selection: kling-v1 (stable), kling-v1.5 (latest)
- Returns task ID for async processing with polling support

**`GET /api/video-status`** - Video generation status tracking
- Polls Kling API for video generation progress
- Maps API statuses to application-specific statuses
- Returns progress, video URL, thumbnails when complete

**`POST /api/download-image`** - Local image storage
- Downloads remote images to `public/images/` directory
- Creates directory if not exists, handles timeouts
- Returns local URL and file metadata

**`GET /api/scan-images`** - Gallery synchronization
- Scans `public/images/` directory for existing files
- Returns file metadata (size, modification date)
- Used for gallery state synchronization

**`GET/POST /api/metadata`** - Gallery metadata management
- Reads/writes `public/gallery-metadata.json`
- Maintains image generation history and parameters

### State Management Patterns

**Custom Hooks Pattern:**
- `useImageGeneration.ts` - Generation form state and API calls
- `useGallery.ts` - Gallery data with local storage persistence
- `useImageModal.ts` - Modal state and navigation
- `useTheme.ts` - Dark/light theme with system preference detection
- `useVideoGeneration.ts` - Video generation state with intelligent polling

**Image Editor State:**
- Canvas-based rendering with multi-layer composition system
- Coordinate system uses image-relative positioning (0,0 = top-left of image)
- All tools (crop, extend, layers) work within image bounds
- History system for undo/redo with comprehensive state snapshots
- Full-screen editor with professional UI and keyboard shortcuts
- Advanced layer management with transparency, transformations, and blending

### Key Technical Details

**Image Processing:**
- Next.js Image component configured for `fal.media` domain
- Local image storage in `public/images/` with automatic filename generation
- Metadata tracking includes model used, finetune settings, and generation parameters

**Theme System:**
- Server-side dark mode detection script in layout to prevent flash
- CSS custom properties with Tailwind dark mode classes
- Theme persistence in localStorage with system preference fallback

**Fine-tune Configuration:**
- Pre-configured fine-tune models in `types/image-generation.ts`
- Trigger word detection for gallery filtering
- Model-specific parameter handling in generation API

### Development Workflow

When adding new features:
1. Follow existing hook patterns for state management
2. Use TypeScript interfaces from `types/` directory
3. Maintain consistency with existing API route structure
4. Update gallery metadata system if adding new image operations
5. Ensure dark mode compatibility in all UI components

### Cost Optimization Opportunities (Future Consideration)

**Current API Costs (High):**
- Bria Expand: ~$0.04 per image extension
- Ideogram Reframe: ~$0.03-0.09 per image
- BiRefNet: ~$0.02-0.04 per background removal
- FLUX Pro: ~$0.035 per generation

**Potential Low-Cost Alternatives:**
- **Stable Diffusion Outpainting**: $0.0015-0.0035 per image (90%+ savings)
  - Novita.ai SD Outpainting: $0.0015/image
  - Segmind SD Outpainting: Free tier available
  - fal.ai SD Inpainting: $0.0035/image
- **SD Background Removal**: Alternatives available
- **SDXL Generation**: $0.0035/image vs FLUX Pro $0.035

**Implementation Strategy for Future:**
1. Tiered system: Default (SD), Premium (current Bria/Ideogram)
2. User choice between "Fast & Cheap" vs "Premium Quality"
3. Smart model selection based on budget/quality requirements
4. Expected 85-95% cost reduction while maintaining quality options

## Image Editor Implementation (Phase 1-5 Complete)

This comprehensive image editor was implemented across 5 phases with advanced AI-powered capabilities:

### Phase 1: Enhanced Canvas Management ✅
- **Multi-layer composition system** with advanced layer controls
- **Zoom and pan functionality** with fit-to-screen and precision controls
- **Professional drag-and-drop interface** with visual feedback
- **Import/export workflows** with multiple format support (PNG, JPEG, WebP)
- **Enhanced save functionality** with complete edit history preservation

### Phase 2: Advanced Selection and Background Tools ✅
- **Phase 2A: Smart Selection Tool** - One-click background removal using BiRefNet
- **Phase 2B: Manual Edge Refinement** - Advanced edge detection and refinement tools:
  - **Magic Wand Tool**: Flood fill algorithm with configurable tolerance
  - **Edge Detection**: Sobel edge detection with sensitivity controls  
  - **Advanced Brush Modes**: Smooth and sharpen modes with hardness controls
  - **Feathering Algorithms**: Natural edge transitions and blending

### Phase 3: Transform and Manipulation Tools ✅
- **Phase 3A: Advanced Crop Tool** - Precision cropping with visual guides
- **Phase 3B: Perspective Transformation** - Complete perspective control system:
  - **Corner-based transformation** with visual handles and real-time preview
  - **Perspective presets** (bird's eye, worm's eye, dramatic angles)
  - **Flip operations** (horizontal, vertical, both)
  - **CSS clip-path rendering** for accurate perspective effects

### Phase 4: Workflow and Import Enhancements ✅
- **Phase 4A: Advanced Import System** - Multi-file drag-and-drop with validation
- **Phase 4B: Asset Library Integration** - Curated stock photos and graphics
- **Phase 4C: Enhanced Export Options** - Professional export system:
  - **Multiple format support** with format-specific optimizations
  - **Quality controls** and compression settings
  - **Metadata preservation** with complete edit history tracking
  - **Gallery integration** with enhanced metadata and versioning

### Phase 5: Kling AI Video Generation ✅
Complete video generation integration using Kling AI API:

**Core Video Generation:**
- **Image-to-video conversion** from editor compositions
- **Multiple duration options** (5s, 10s) with cost estimates
- **Aspect ratio support** (16:9, 9:16, 1:1) for different platforms
- **Motion intensity controls** (low, medium, high) for animation style
- **Creativity levels** (0-100%) for artistic interpretation control
- **Model selection** (kling-v1 stable, kling-v1.5 latest)

**Advanced Video Features:**
- **Real-time progress tracking** with intelligent polling system
- **Video preview and download** with thumbnail generation
- **Error handling and retry** mechanisms for failed generations
- **Canvas composition rendering** - generates video from current editor state
- **Professional UI integration** with gradient video generation button

**Technical Implementation:**
- **Async video processing** with task-based polling (3-second intervals)
- **Status mapping system** from Kling API to application states
- **Timeout protection** (10-minute maximum with graceful handling)
- **Complete error recovery** with user-friendly messaging
- **Video metadata tracking** including generation parameters and source images

### Key Technical Features

**Advanced Canvas Rendering:**
- **Layer-based composition** with transform matrices and blending modes
- **High-quality scaling algorithms** with image smoothing and quality preservation
- **Real-time preview** for all editing operations
- **Memory-efficient processing** with canvas optimization techniques

**Professional UI/UX:**
- **Keyboard shortcuts** (Ctrl+Z undo, Ctrl+S save, Escape close)
- **Context-sensitive tools** that adapt to current layer and selection
- **Visual feedback systems** with loading states and progress indicators
- **Responsive design** that works across different screen sizes

**Data Management:**
- **Complete edit history** with undo/redo system (unlimited steps)
- **Metadata preservation** including tool usage and transformation history
- **Gallery integration** with enhanced search and filtering capabilities
- **Local storage optimization** with automatic cleanup and file management

### Video Generation Workflow

1. **User creates/edits image** in the comprehensive editor
2. **Clicks "Generate Video"** button (gradient purple/pink styling)
3. **Configures video parameters** via professional form interface:
   - Prompt for motion description
   - Duration (5s recommended, 10s available)
   - Aspect ratio for target platform
   - Motion intensity and creativity levels
   - AI model selection
4. **Canvas composition rendered** to source image automatically
5. **Video generation initiated** with task ID returned
6. **Real-time progress tracking** with estimated completion times
7. **Video preview and download** upon completion

### Environment Requirements

```env
# Required for core functionality
FAL_KEY=your_fal_api_key_here

# Required for video generation
KLING_API_KEY=your_kling_api_key_here
```

### Cost Structure (Estimated)
- **Image generation**: ~$0.035 per FLUX Pro image
- **Background removal**: ~$0.02-0.04 per BiRefNet operation  
- **Image extension**: ~$0.04 per Bria Expand operation
- **Video generation**: ~$0.12 per 5-second video, ~$0.24 per 10-second video

### Testing

No specific test framework is configured. When implementing tests, check the codebase for any testing setup first.

- to memorize