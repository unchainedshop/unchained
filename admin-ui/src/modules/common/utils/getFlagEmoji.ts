const getFlagEmoji = (code: string) => {
  if (!code || code.length !== 2) return '';
  return code
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65),
    );
};
export default getFlagEmoji;
