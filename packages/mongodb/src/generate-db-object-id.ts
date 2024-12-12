/**
 * @name Random.hexString
 * @summary Return a random string of `n` hexadecimal digits.
 * @locus Anywhere
 * @param {Number} n Length of the string
 */
function toHex(buffer) {
  return Array.prototype.map.call(buffer, (x) => x.toString(16).padStart(2, '0')).join('');
}

export const generateDbObjectId = (digits = 24): string => {
  const numBytes = Math.ceil(digits / 2);
  const bytes = crypto.getRandomValues(new Uint8Array(numBytes));
  const result = toHex(bytes);
  return result.substring(0, digits);
};
