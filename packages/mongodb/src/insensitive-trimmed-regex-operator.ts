export function insensitiveTrimmedRegexOperator(string) {
  if (typeof string !== 'string') {
    throw new TypeError('Expected a string');
  }
  const escapped = string.trim().replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
  return { $regex: new RegExp(`^${escapped}$`, 'i') };
}
