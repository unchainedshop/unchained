import crypto from 'crypto';

export default function randomValueHex(len: number): string {
  return crypto
    .randomBytes(Math.ceil(len / 2))
    .toString('hex') // convert to hexadecimal format
    .slice(0, len); // return required number of characters
}
