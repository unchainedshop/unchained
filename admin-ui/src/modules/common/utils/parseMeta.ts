const parseMeta = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && Object.keys(parsed).length
      ? parsed
      : undefined;
  } catch {
    return undefined;
  }
};

export default parseMeta;
