export default (tags: string[]): string[] | null => {
  if (Array.isArray(tags)) return tags.map((tag) => tag.toLowerCase());
  return null;
};
