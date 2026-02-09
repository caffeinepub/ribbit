/**
 * Client-side image compression utility for Ribbit app.
 * Validates, resizes, and compresses images before upload.
 * Preserves animated GIFs by skipping recompression.
 */

const MAX_DIMENSION = 2048; // Maximum width or height in pixels
const JPEG_QUALITY = 0.85; // Quality for JPEG compression (0-1)
const WEBP_QUALITY = 0.85; // Quality for WebP compression (0-1)

export interface CompressionResult {
  bytes: Uint8Array<ArrayBuffer>;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  wasCompressed: boolean;
}

/**
 * Validates that a file is an image.
 * @throws Error with user-friendly message if not an image
 */
function validateImageFile(file: File): void {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file.');
  }
}

/**
 * Checks if a file is an animated GIF by examining its structure.
 */
async function isAnimatedGif(file: File): Promise<boolean> {
  if (file.type !== 'image/gif') {
    return false;
  }

  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Look for multiple image blocks in GIF
    let imageBlockCount = 0;
    for (let i = 0; i < bytes.length - 1; i++) {
      // Image separator byte is 0x2C
      if (bytes[i] === 0x2C) {
        imageBlockCount++;
        if (imageBlockCount > 1) {
          return true; // Multiple frames = animated
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Loads an image file into an HTMLImageElement.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image.'));
    };
    
    img.src = url;
  });
}

/**
 * Calculates new dimensions that fit within MAX_DIMENSION while preserving aspect ratio.
 */
function calculateResizedDimensions(width: number, height: number): { width: number; height: number } {
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return { width, height };
  }
  
  const aspectRatio = width / height;
  
  if (width > height) {
    return {
      width: MAX_DIMENSION,
      height: Math.round(MAX_DIMENSION / aspectRatio),
    };
  } else {
    return {
      width: Math.round(MAX_DIMENSION * aspectRatio),
      height: MAX_DIMENSION,
    };
  }
}

/**
 * Compresses an image using canvas and returns the result as a Blob.
 */
async function compressImage(img: HTMLImageElement, mimeType: string): Promise<Blob> {
  const { width, height } = calculateResizedDimensions(img.width, img.height);
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context.');
  }
  
  // Use high-quality image rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Draw the resized image
  ctx.drawImage(img, 0, 0, width, height);
  
  // Determine output format and quality
  let outputMimeType = mimeType;
  let quality = JPEG_QUALITY;
  
  // Convert PNG to JPEG for better compression (unless it has transparency)
  if (mimeType === 'image/png') {
    // Check for transparency
    const imageData = ctx.getImageData(0, 0, width, height);
    const hasTransparency = imageData.data.some((_, i) => i % 4 === 3 && imageData.data[i] < 255);
    
    if (!hasTransparency) {
      outputMimeType = 'image/jpeg';
      quality = JPEG_QUALITY;
    } else {
      // Keep as PNG but try WebP if supported
      outputMimeType = 'image/webp';
      quality = WEBP_QUALITY;
    }
  } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    outputMimeType = 'image/jpeg';
    quality = JPEG_QUALITY;
  } else {
    // Try WebP for other formats
    outputMimeType = 'image/webp';
    quality = WEBP_QUALITY;
  }
  
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to compress image.'));
        }
      },
      outputMimeType,
      quality
    );
  });
}

/**
 * Main compression function that handles validation, compression, and fallback.
 * @param file - The image file to compress
 * @returns CompressionResult with bytes and preview URL
 */
export async function compressImageFile(file: File): Promise<CompressionResult> {
  const originalSize = file.size;
  
  // Validate that it's an image
  validateImageFile(file);
  
  // Check if it's an animated GIF - skip compression to preserve animation
  const isAnimated = await isAnimatedGif(file);
  if (isAnimated) {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer) as Uint8Array<ArrayBuffer>;
    const previewUrl = URL.createObjectURL(file);
    
    return {
      bytes,
      previewUrl,
      originalSize,
      compressedSize: bytes.length,
      wasCompressed: false,
    };
  }
  
  try {
    // Load the image
    const img = await loadImage(file);
    
    // Compress the image
    const compressedBlob = await compressImage(img, file.type);
    
    // Convert to Uint8Array
    const arrayBuffer = await compressedBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer) as Uint8Array<ArrayBuffer>;
    
    // Create preview URL from compressed blob
    const previewUrl = URL.createObjectURL(compressedBlob);
    
    return {
      bytes,
      previewUrl,
      originalSize,
      compressedSize: bytes.length,
      wasCompressed: true,
    };
  } catch (error) {
    // Fallback: use original file if compression fails
    console.error('Image compression failed, using original:', error);
    
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer) as Uint8Array<ArrayBuffer>;
    const previewUrl = URL.createObjectURL(file);
    
    return {
      bytes,
      previewUrl,
      originalSize,
      compressedSize: bytes.length,
      wasCompressed: false,
    };
  }
}

/**
 * Helper to clean up preview URLs when they're no longer needed.
 */
export function revokePreviewUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
