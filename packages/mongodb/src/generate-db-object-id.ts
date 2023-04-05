import crypto from 'crypto';

/**
 * @name Random.hexString
 * @summary Return a random string of `n` hexadecimal digits.
 * @locus Anywhere
 * @param {Number} n Length of the string
 */
export const generateDbObjectId = (digits = 24): string => {
  const numBytes = Math.ceil(digits / 2);
  let bytes;
  // Try to get cryptographically strong randomness. Fall back to
  // non-cryptographically strong if not available.
  try {
    bytes = crypto.randomBytes(numBytes);
  } catch (e) {
    // XXX should re-throw any error except insufficient entropy
    bytes = crypto.pseudoRandomBytes(numBytes);
  }
  const result = bytes.toString('hex');
  // If the number of digits is odd, we'll have generated an extra 4 bits
  // of randomness, so we need to trim the last digit.
  return result.substring(0, digits);
};
