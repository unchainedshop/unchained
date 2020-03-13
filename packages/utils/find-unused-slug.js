import defaultSlugify from './slugify';

const DELIMITER = '-';

const addSuffixToSlug = (slug, index = 1, delimiter = DELIMITER) => {
  return `${slug}${delimiter}${index}`;
};

const incrementSuffixedSlug = (slugIncludingSuffix, delimiter = DELIMITER) => {
  const slugParts = slugIncludingSuffix.split(delimiter);
  const suffixedIndex = parseInt(slugParts.pop(), 10);
  const slugWithoutSuffix = slugParts.join(delimiter);
  return addSuffixToSlug(slugWithoutSuffix, suffixedIndex + 1);
};

export default (checkSlugIsUniqueFn, { slugify = defaultSlugify } = {}) => {
  const findUnusedSlug = ({ title, existingSlug, newSlug }) => {
    const slug = newSlug || existingSlug || `${slugify(title)}`;
    if (!checkSlugIsUniqueFn(slug)) {
      const isSlugAlreadySuffixed = !!newSlug;
      return findUnusedSlug({
        newSlug: isSlugAlreadySuffixed
          ? incrementSuffixedSlug(slug)
          : addSuffixToSlug(slug)
      });
    }
    return slug;
  };
  return findUnusedSlug;
};
