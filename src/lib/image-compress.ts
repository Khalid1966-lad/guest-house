import sharp from "sharp"

/**
 * Compression presets for different image types
 */
export type ImageCompressPreset = "logo" | "avatar" | "room" | "receipt" | "menu" | "general"

interface CompressOptions {
  /** Maximum width in pixels. Default: 1920 */
  maxWidth?: number
  /** Maximum height in pixels. Default: 1920 */
  maxHeight?: number
  /** Output quality (1-100). Default: 85 */
  quality?: number
  /** Output format. Default: "webp" */
  format?: "webp" | "jpeg" | "png"
  /** Maximum output file size in bytes. Default: 500KB */
  maxFileSize?: number
  /** Minimum quality to accept when auto-reducing for maxFileSize. Default: 60 */
  minQuality?: number
}

const PRESETS: Record<ImageCompressPreset, CompressOptions> = {
  logo: {
    maxWidth: 512,
    maxHeight: 512,
    quality: 90,
    format: "webp",
    maxFileSize: 200 * 1024, // 200KB for logo
    minQuality: 75,
  },
  avatar: {
    maxWidth: 256,
    maxHeight: 256,
    quality: 85,
    format: "webp",
    maxFileSize: 100 * 1024, // 100KB for avatar
    minQuality: 65,
  },
  room: {
    maxWidth: 1280,
    maxHeight: 800,
    quality: 75,
    format: "webp",
    maxFileSize: 100 * 1024, // 100KB per room image (target)
    minQuality: 40,
  },
  receipt: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 85,
    format: "webp",
    maxFileSize: 300 * 1024, // 300KB for receipts
    minQuality: 65,
  },
  menu: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 82,
    format: "webp",
    maxFileSize: 200 * 1024, // 200KB for menu items
    minQuality: 65,
  },
  general: {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 85,
    format: "webp",
    maxFileSize: 500 * 1024,
    minQuality: 60,
  },
}

export interface CompressResult {
  /** Compressed image as a Buffer */
  buffer: Buffer
  /** MIME type of the output */
  mimeType: string
  /** Output width in pixels */
  width: number
  /** Output height in pixels */
  height: number
  /** Output file size in bytes */
  size: number
  /** Output format */
  format: string
  /** Original file size in bytes (if available) */
  originalSize?: number
  /** Compression ratio (percentage saved) */
  compressionRatio?: number
}

/**
 * Compress an image buffer using sharp with smart quality reduction.
 * Automatically adjusts quality down to minQuality to meet maxFileSize.
 *
 * @param input - The input image as a Buffer or Uint8Array
 * @param presetOrOptions - Either a preset name or custom options
 * @returns CompressResult with the compressed image data
 */
export async function compressImage(
  input: Buffer | Uint8Array | ArrayBuffer,
  presetOrOptions: ImageCompressPreset | CompressOptions
): Promise<CompressResult> {
  const options: CompressOptions =
    typeof presetOrOptions === "string" ? PRESETS[presetOrOptions] : presetOrOptions

  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 85,
    format = "webp",
    maxFileSize = 500 * 1024,
    minQuality = 60,
  } = options

  const buffer = input instanceof ArrayBuffer ? Buffer.from(input) : Buffer.from(input)
  const originalSize = buffer.length

  // Get original image metadata
  const metadata = await sharp(buffer).metadata()
  const origWidth = metadata.width || maxWidth
  const origHeight = metadata.height || maxHeight

  // Calculate resize dimensions (only downscale, never upscale)
  let targetWidth = origWidth
  let targetHeight = origHeight

  if (origWidth > maxWidth || origHeight > maxHeight) {
    const ratio = Math.min(maxWidth / origWidth, maxHeight / origHeight)
    targetWidth = Math.round(origWidth * ratio)
    targetHeight = Math.round(origHeight * ratio)
  }

  // Determine output format configuration
  const sharpFormat = format === "webp" ? "webp" : format === "jpeg" ? "jpeg" : "png"

  // Start with the requested quality
  let currentQuality = quality
  let compressedBuffer: Buffer
  let attempts = 0
  const maxAttempts = 8

  do {
    compressedBuffer = await sharp(buffer)
      .resize(targetWidth, targetHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      [sharpFormat === "webp" ? "webp" : sharpFormat === "jpeg" ? "jpeg" : "png"]({
        quality: currentQuality,
        effort: 4, // Good balance of speed vs compression
        smartSubsample: format === "webp",
        mozjpeg: format === "jpeg", // Use mozjpeg for better JPEG compression
      })
      .toBuffer()

    attempts++
    // If still too large and we can reduce quality more, try again
    if (compressedBuffer.length > maxFileSize && currentQuality > minQuality) {
      // Reduce quality proportionally to how much we need to shrink
      const ratio = maxFileSize / compressedBuffer.length
      currentQuality = Math.max(minQuality, Math.round(currentQuality * ratio * 0.9))
    }
  } while (compressedBuffer.length > maxFileSize && currentQuality > minQuality && attempts < maxAttempts)

  // Get output metadata
  const outputMetadata = await sharp(compressedBuffer).metadata()
  const mimeType = format === "webp" ? "image/webp" : format === "jpeg" ? "image/jpeg" : "image/png"

  const compressionRatio = originalSize > 0
    ? Math.round(((originalSize - compressedBuffer.length) / originalSize) * 100)
    : 0

  return {
    buffer: compressedBuffer,
    mimeType,
    width: outputMetadata.width || targetWidth,
    height: outputMetadata.height || targetHeight,
    size: compressedBuffer.length,
    format,
    originalSize,
    compressionRatio: compressionRatio > 0 ? compressionRatio : undefined,
  }
}

/**
 * Convert a compressed image buffer to a base64 data URL
 */
export function compressToDataUrl(result: CompressResult): string {
  const base64 = result.buffer.toString("base64")
  return `data:${result.mimeType};base64,${base64}`
}

/**
 * Full pipeline: compress image and return as base64 data URL
 */
export async function compressImageToDataUrl(
  input: Buffer | Uint8Array | ArrayBuffer,
  presetOrOptions: ImageCompressPreset | CompressOptions
): Promise<{ dataUrl: string; result: CompressResult }> {
  const result = await compressImage(input, presetOrOptions)
  return {
    dataUrl: compressToDataUrl(result),
    result,
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 octets"
  const k = 1024
  const sizes = ["octets", "Ko", "Mo", "Go"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

/**
 * Validate that a file is a supported image type
 */
export function isValidImageType(mimeType: string): boolean {
  return ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/tiff"].includes(mimeType)
}

/**
 * Convert GIF to static image (first frame) for compression.
 * GIFs with transparency get converted to PNG, others to WebP.
 */
export async function convertGifToStatic(input: Buffer | Uint8Array): Promise<Buffer> {
  return sharp(Buffer.from(input))
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()
}
