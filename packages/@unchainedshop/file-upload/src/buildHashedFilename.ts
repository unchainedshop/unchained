import crypto from 'crypto';
import { slugify } from '@unchainedshop/utils';
import baseX from 'base-x';

const b62 = baseX('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

export default function buildHashedFilename(
  directoryName: string,
  fileName: string,
  expiryDate: Date,
): string {
  const hashed = crypto
    .createHash('md5')
    .update(`${directoryName}${fileName}${expiryDate.getTime()}`) // ignore the year, we need
    .digest('hex');

  const splittedFilename = fileName.split('.');
  const ext = splittedFilename?.pop();
  const fileNameWithoutExtension = splittedFilename.join('.') || '';
  const slugifiedFilenameWithExtension = [slugify(fileNameWithoutExtension), ext]
    .filter(Boolean)
    .join('.');
  const arr = Uint8Array.from(Buffer.from(hashed, 'hex'));
  const b62converted = b62.encode(arr);

  return `${b62converted}-${slugifiedFilenameWithExtension}`;
}
