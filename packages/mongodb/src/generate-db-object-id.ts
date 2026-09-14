/** Convert a byte buffer to lowercase hexadecimal. */
function toHex(buffer) {
  return Array.prototype.map.call(buffer, (x) => x.toString(16).padStart(2, '0')).join('');
}

/** Generate a random hexadecimal string; defaults to 24 digits. */
export const generateDbObjectId = (digits = 24): string => {
  const numBytes = Math.ceil(digits / 2);
  const bytes = crypto.getRandomValues(new Uint8Array(numBytes));
  const result = toHex(bytes);
  return result.substring(0, digits);
};
