const INLINE_CONTENT_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'video/mp4',
  'video/webm',
]);

export const buildDownloadSafetyHeaders = (contentType?: string | null): Record<string, string> => {
  const mediaType = contentType?.split(';')[0]?.trim().toLowerCase();

  return {
    'Content-Disposition': mediaType && INLINE_CONTENT_TYPES.has(mediaType) ? 'inline' : 'attachment',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
  };
};
