import { sha1, slugify } from '@unchainedshop/utils';

/**
 * Allowed file extensions whitelist.
 * Only files with these extensions can be uploaded.
 */
const ALLOWED_EXTENSIONS = new Set([
  // Images
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'svg',
  'ico',
  'bmp',
  'tiff',
  'tif',
  // Documents
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'odt',
  'ods',
  'odp',
  // Text
  'txt',
  'csv',
  'json',
  'xml',
  'md',
  // Media
  'mp4',
  'webm',
  'mp3',
  'wav',
  'ogg',
  'm4a',
  'mov',
  'avi',
  // Archives
  'zip',
  'tar',
  'gz',
  'rar',
  '7z',
]);

export default async function buildHashedFilename(
  directoryName: string,
  fileName: string,
  expiryDate: Date,
): Promise<string> {
  const hashed = await sha1(`${directoryName}${fileName}${expiryDate.getTime()}`);

  const splittedFilename = fileName.split('.');
  const ext = splittedFilename?.pop()?.toLowerCase();

  // Validate file extension against whitelist
  if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(`File extension not allowed: .${ext}`);
  }

  const fileNameWithoutExtension = splittedFilename.join('.') || '';
  const slugifiedFilenameWithExtension = [slugify(fileNameWithoutExtension), ext]
    .filter(Boolean)
    .join('.');
  const base64url = Buffer.from(hashed).toString('base64url');

  return `${base64url}.${slugifiedFilenameWithExtension}`;
}
