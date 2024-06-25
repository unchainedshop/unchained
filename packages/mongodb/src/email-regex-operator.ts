export function emailRegexOperator(string) {
  if (typeof string !== 'string') {
    throw new TypeError('Expected a string');
  }
  const escappedEmail = string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
  return { $regex: new RegExp(`/${escappedEmail}$/`, 'i') };
}
