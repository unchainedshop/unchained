/**
 * Escape special regex characters to prevent ReDoS attacks.
 */
export function escapeRegexString(string: string): string {
  if (typeof string !== 'string') {
    throw new TypeError('Expected a string');
  }
  return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function insensitiveTrimmedRegexOperator(string) {
  if (typeof string !== 'string') {
    throw new TypeError('Expected a string');
  }
  const escaped = escapeRegexString(string.trim());

  if (escaped.length === 0) throw new Error('String is empty after trimming');
  if (escaped.length > 255) throw new Error('String exceeds maximum allowed length');

  return { $regex: new RegExp(`^${escaped}$`, 'i') };
}
