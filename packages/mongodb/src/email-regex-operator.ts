export function emailRegexOperator(string) {
  if (typeof string !== 'string') {
    throw new TypeError('Expected a string');
  }
  const escapped = string.trim().replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

  if (escapped.length === 0) throw new Error('String is empty after trimming');
  if (escapped.length > 255) throw new Error('String exceeds maximum allowed length');

  return { $regex: new RegExp(`^${escapped}$`, 'i') };
}
