/**
 * MIME type constants
 *
 * @description Common MIME types for content negotiation and response headers.
 * Follows IANA media type registry.
 *
 * @see https://www.iana.org/assignments/media-types/media-types.xhtml
 */

/**
 * Common MIME types
 */
export const MIME_TYPES = {
  // Text
  TEXT_PLAIN: 'text/plain',
  TEXT_HTML: 'text/html',
  TEXT_CSS: 'text/css',
  TEXT_JAVASCRIPT: 'text/javascript',
  TEXT_XML: 'text/xml',
  TEXT_CSV: 'text/csv',

  // Application
  APPLICATION_JSON: 'application/json',
  APPLICATION_XML: 'application/xml',
  APPLICATION_PDF: 'application/pdf',
  APPLICATION_ZIP: 'application/zip',
  APPLICATION_GZIP: 'application/gzip',
  APPLICATION_OCTET_STREAM: 'application/octet-stream',
  APPLICATION_FORM_URLENCODED: 'application/x-www-form-urlencoded',
  APPLICATION_JAVASCRIPT: 'application/javascript',

  // Multipart
  MULTIPART_FORM_DATA: 'multipart/form-data',
  MULTIPART_MIXED: 'multipart/mixed',

  // Image
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_PNG: 'image/png',
  IMAGE_GIF: 'image/gif',
  IMAGE_SVG: 'image/svg+xml',
  IMAGE_WEBP: 'image/webp',
  IMAGE_ICO: 'image/x-icon',

  // Audio
  AUDIO_MPEG: 'audio/mpeg',
  AUDIO_OGG: 'audio/ogg',
  AUDIO_WAV: 'audio/wav',
  AUDIO_WEBM: 'audio/webm',

  // Video
  VIDEO_MP4: 'video/mp4',
  VIDEO_WEBM: 'video/webm',
  VIDEO_OGG: 'video/ogg',

  // Font
  FONT_WOFF: 'font/woff',
  FONT_WOFF2: 'font/woff2',
  FONT_TTF: 'font/ttf',
  FONT_OTF: 'font/otf',
} as const;

/**
 * Default MIME type for unknown files
 */
export const DEFAULT_MIME_TYPE = MIME_TYPES.APPLICATION_OCTET_STREAM;

/**
 * MIME types that should be compressed
 */
export const COMPRESSIBLE_MIME_TYPES: readonly string[] = [
  MIME_TYPES.TEXT_PLAIN,
  MIME_TYPES.TEXT_HTML,
  MIME_TYPES.TEXT_CSS,
  MIME_TYPES.TEXT_JAVASCRIPT,
  MIME_TYPES.TEXT_XML,
  MIME_TYPES.APPLICATION_JSON,
  MIME_TYPES.APPLICATION_XML,
  MIME_TYPES.APPLICATION_JAVASCRIPT,
  MIME_TYPES.IMAGE_SVG,
] as const;
