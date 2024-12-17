import { sha1, slugify } from '@unchainedshop/utils';
import baseX from 'base-x';

const b62 = baseX('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

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
  const b62converted = b62.encode(hashed);

  return `${b62converted}-${slugifiedFilenameWithExtension}`;
}
