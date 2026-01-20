import { sha1, slugify } from '@unchainedshop/utils';

export default async function buildHashedFilename(
  directoryName: string,
  fileName: string,
  expiryDate: Date,
): Promise<string> {
  const hashed = await sha1(`${directoryName}${fileName}${expiryDate.getTime()}`);

  const splittedFilename = fileName.split('.');
  const ext = splittedFilename?.pop();
  const fileNameWithoutExtension = splittedFilename.join('.') || '';
  const slugifiedFilenameWithExtension = [slugify(fileNameWithoutExtension), ext]
    .filter(Boolean)
    .join('.');
  const base64url = Buffer.from(hashed).toString('base64url');

  return `${base64url}.${slugifiedFilenameWithExtension}`;
}
