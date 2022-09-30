export default (tags) => {
  if (Array.isArray(tags)) return tags.map((tag) => tag.toLowerCase());
  return null;
};
