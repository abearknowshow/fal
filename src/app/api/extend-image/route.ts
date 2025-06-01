import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { readFile } from 'fs/promises';
import { join } from 'path';
import imageSize from 'image-size';

// Configure FAL client
fal.config({
  credentials: process.env.FAL_KEY,
});

// Available models for image extension with their capabilities
const EXTENSION_MODELS = {
  BRIA_EXPAND: 'fal-ai/bria/expand',
  IDEOGRAM_REFRAME: 'fal-ai/ideogram/v3/reframe',
  FLUX_FILL: 'fal-ai/flux-lora/inpainting'
} as const;

interface ImageDimensions {
  width: number;
  height: number;
}

interface ExtensionConfig {
  originalSize: ImageDimensions;
  canvasSize: ImageDimensions;
  originalLocation: [number, number];
}

// Calculate extension configuration based on direction and amount
function calculateExtensionConfig(
  originalWidth: number,
  originalHeight: number,
  direction: string,
  amount: number
): ExtensionConfig {
  let canvasWidth = originalWidth;
  let canvasHeight = originalHeight;
  let originalX = 0;
  let originalY = 0;

  switch (direction) {
    case 'right':
      canvasWidth += amount;
      break;
    case 'left':
      canvasWidth += amount;
      originalX = amount;
      break;
    case 'bottom':
      canvasHeight += amount;
      break;
    case 'top':
      canvasHeight += amount;
      originalY = amount;
      break;
    default:
      throw new Error(`Invalid direction: ${direction}`);
  }

  return {
    originalSize: { width: originalWidth, height: originalHeight },
    canvasSize: { width: canvasWidth, height: canvasHeight },
    originalLocation: [originalX, originalY]
  };
}

// Detect actual image dimensions from various sources
async function detectImageDimensions(imageInput: string): Promise<ImageDimensions> {
  try {
    // Handle data URIs (base64)
    if (imageInput.startsWith('data:')) {
      console.log('Detecting dimensions from data URI...');
      
      // Convert data URI to buffer
      const base64Data = imageInput.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const dimensions = imageSize(buffer);
      
      if (dimensions.width && dimensions.height) {
        console.log('Detected dimensions from data URI:', { width: dimensions.width, height: dimensions.height });
        return { width: dimensions.width, height: dimensions.height };
      }
    }
    
    // Handle local file paths
    if (imageInput.startsWith('/')) {
      console.log('Detecting dimensions from local file...');
      
      const publicPath = join(process.cwd(), 'public', imageInput);
      const fileBuffer = await readFile(publicPath);
      const dimensions = imageSize(fileBuffer);
      
      if (dimensions.width && dimensions.height) {
        console.log('Detected dimensions from local file:', { width: dimensions.width, height: dimensions.height });
        return { width: dimensions.width, height: dimensions.height };
      }
    }
    
    // Handle remote URLs
    if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
      console.log('Detecting dimensions from remote URL...');
      
      const response = await fetch(imageInput);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const buffer = await response.arrayBuffer();
      const dimensions = imageSize(Buffer.from(buffer));
      
      if (dimensions.width && dimensions.height) {
        console.log('Detected dimensions from remote URL:', { width: dimensions.width, height: dimensions.height });
        return { width: dimensions.width, height: dimensions.height };
      }
    }
    
    throw new Error('Could not detect image dimensions');
    
  } catch (error) {
    console.warn('Failed to detect image dimensions, using defaults:', error);
    // Fallback to default dimensions
    return { width: 1024, height: 768 };
  }
}

// Get default image dimensions (fallback) - used in error cases
// function getDefaultImageDimensions(): ImageDimensions {
//   return { width: 1024, height: 768 };
// }

// Convert local image path or data URI to a URL that FAL can access
async function prepareImageForFAL(imageInput: string): Promise<string> {
  // If it's already a valid HTTP/HTTPS URL, return as-is
  if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    return imageInput;
  }

  // If it's a data URI (base64), upload to FAL storage
  if (imageInput.startsWith('data:')) {
    try {
      console.log('Uploading base64 image to FAL storage...');
      
      // Convert data URI to blob
      const response = await fetch(imageInput);
      const blob = await response.blob();
      
      // Upload to FAL storage
      const uploadedUrl = await fal.storage.upload(blob);
      console.log('Successfully uploaded to FAL storage:', uploadedUrl);
      
      return uploadedUrl;
    } catch (error) {
      console.error('Failed to upload base64 image to FAL storage:', error);
      throw new Error('Failed to process base64 image');
    }
  }

  // If it's a local path (starts with /), try to read from public directory
  if (imageInput.startsWith('/')) {
    try {
      console.log('Converting local image to base64...');
      
      // Read file from public directory
      const publicPath = join(process.cwd(), 'public', imageInput);
      const fileBuffer = await readFile(publicPath);
      
      // Determine MIME type based on file extension
      const extension = imageInput.split('.').pop()?.toLowerCase();
      let mimeType = 'image/jpeg'; // default
      
      switch (extension) {
        case 'png':
          mimeType = 'image/png';
          break;
        case 'gif':
          mimeType = 'image/gif';
          break;
        case 'webp':
          mimeType = 'image/webp';
          break;
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
      }
      
      // Convert to base64 data URI
      const base64 = fileBuffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64}`;
      
      // Upload to FAL storage
      const response = await fetch(dataUri);
      const blob = await response.blob();
      const uploadedUrl = await fal.storage.upload(blob);
      
      console.log('Successfully converted local image and uploaded to FAL storage:', uploadedUrl);
      return uploadedUrl;
      
    } catch (error) {
      console.error('Failed to process local image:', error);
      throw new Error(`Failed to process local image: ${imageInput}`);
    }
  }

  // If we get here, it's an unsupported format
  throw new Error(`Unsupported image format: ${imageInput}`);
}

// Optimize image for processing (future enhancement)
function optimizeImageForProcessing(dimensions: ImageDimensions): ImageDimensions {
  const MAX_DIMENSION = 2048;
  const MIN_DIMENSION = 256;
  
  let { width, height } = dimensions;
  
  // Ensure minimum dimensions
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    const scale = Math.max(MIN_DIMENSION / width, MIN_DIMENSION / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
    console.log('Upscaled image dimensions for processing:', { width, height });
  }
  
  // Ensure maximum dimensions
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
    console.log('Downscaled image dimensions for processing:', { width, height });
  }
  
  return { width, height };
}

// Extend image using Bria Expand model
async function extendWithBriaExpand(
  imageUrl: string,
  config: ExtensionConfig,
  prompt?: string
) {
  console.log('Using Bria Expand model for image extension...');
  
  const result = await fal.subscribe(EXTENSION_MODELS.BRIA_EXPAND, {
    input: {
      image_url: imageUrl,
      canvas_size: [config.canvasSize.width, config.canvasSize.height],
      original_image_size: [config.originalSize.width, config.originalSize.height],
      original_image_location: config.originalLocation,
      ...(prompt && { prompt })
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs?.map((log) => log.message).forEach(console.log);
      }
    },
  });

  if (!result.data?.image?.url) {
    throw new Error('No extended image returned from Bria Expand');
  }

  return {
    imageUrl: result.data.image.url,
    newWidth: config.canvasSize.width,
    newHeight: config.canvasSize.height,
    model: 'bria-expand'
  };
}

// Extend image using Ideogram Reframe model
async function extendWithIdeogramReframe(
  imageUrl: string,
  config: ExtensionConfig,
  prompt?: string
) {
  console.log('Using Ideogram Reframe model for image extension...');
  
  const result = await fal.subscribe(EXTENSION_MODELS.IDEOGRAM_REFRAME, {
    input: {
      image_url: imageUrl,
      image_size: `${config.canvasSize.width}x${config.canvasSize.height}`,
      ...(prompt && { prompt })
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs?.map((log) => log.message).forEach(console.log);
      }
    },
  });

  if (!result.data?.images?.[0]?.url) {
    throw new Error('No extended image returned from Ideogram Reframe');
  }

  return {
    imageUrl: result.data.images[0].url,
    newWidth: config.canvasSize.width,
    newHeight: config.canvasSize.height,
    model: 'ideogram-reframe'
  };
}

// Main extension function with model fallback
async function extendImage(
  imageUrl: string,
  direction: string,
  amount: number,
  prompt?: string
) {
  // Detect actual image dimensions
  const detectedDimensions = await detectImageDimensions(imageUrl);
  
  // Optimize dimensions for processing
  const optimizedDimensions = optimizeImageForProcessing(detectedDimensions);
  
  // Prepare image for FAL (handle local paths, data URIs, etc.)
  const processedImageUrl = await prepareImageForFAL(imageUrl);
  
  // Calculate extension configuration using actual dimensions
  const config = calculateExtensionConfig(
    optimizedDimensions.width,
    optimizedDimensions.height,
    direction,
    amount
  );

  console.log('Extension config:', {
    detected: detectedDimensions,
    optimized: optimizedDimensions,
    canvas: config.canvasSize,
    location: config.originalLocation,
    processedUrl: processedImageUrl.substring(0, 50) + '...'
  });

  // Try models in order of preference
  const models = [
    () => extendWithBriaExpand(processedImageUrl, config, prompt),
    () => extendWithIdeogramReframe(processedImageUrl, config, prompt)
  ];

  let lastError: Error | null = null;

  for (const modelFn of models) {
    try {
      const result = await modelFn();
      console.log(`Successfully extended image using ${result.model}`);
      return result;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Model failed, trying next:`, error);
      continue;
    }
  }

  // If all models fail, throw the last error
  throw lastError || new Error('All extension models failed');
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, direction, amount, prompt } = await request.json();

    console.log('Extend image request:', { 
      imageUrl: imageUrl?.substring(0, 50) + '...', 
      direction, 
      amount, 
      prompt: prompt?.substring(0, 100) + (prompt?.length > 100 ? '...' : '')
    });

    // Validate required parameters
    if (!imageUrl || !direction || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: imageUrl, direction, and amount are required' },
        { status: 400 }
      );
    }

    // Validate direction
    const validDirections = ['top', 'bottom', 'left', 'right'];
    if (!validDirections.includes(direction)) {
      return NextResponse.json(
        { error: `Invalid direction. Must be one of: ${validDirections.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0 || amount > 2000) {
      return NextResponse.json(
        { error: 'Amount must be a positive number between 1 and 2000 pixels' },
        { status: 400 }
      );
    }

    // Check if FAL_KEY is configured
    if (!process.env.FAL_KEY) {
      console.error('FAL_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'FAL API key not configured' },
        { status: 500 }
      );
    }

    // Validate image input (now supports local paths, data URIs, and URLs)
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid image input' },
        { status: 400 }
      );
    }

    console.log('Starting real image extension...');
    
    // Perform the actual image extension
    const result = await extendImage(imageUrl, direction, amount, prompt);

    console.log('Image extension completed successfully:', {
      newWidth: result.newWidth,
      newHeight: result.newHeight,
      model: result.model
    });

    return NextResponse.json({
      imageUrl: result.imageUrl,
      newWidth: result.newWidth,
      newHeight: result.newHeight,
      model: result.model,
      success: true
    });

  } catch (error) {
    console.error('Image extension failed:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('ValidationError') || error.message.includes('422')) {
        return NextResponse.json(
          { 
            error: 'Invalid input parameters for image extension',
            details: 'Please check your image URL and extension parameters'
          },
          { status: 422 }
        );
      }
      
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            details: 'Please wait a moment before trying again'
          },
          { status: 429 }
        );
      }

      if (error.message.includes('Failed to process')) {
        return NextResponse.json(
          { 
            error: 'Image processing failed',
            details: error.message
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to extend image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 