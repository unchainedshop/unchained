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

export default (Collection, { slugify = defaultSlugify } = {}) => {
  const findUnusedSlug = ({ title, existingSlug, newSlug }, scopeSelector) => {
    const slug = newSlug || existingSlug || `${slugify(title)}`;
    if (Collection.find({ ...scopeSelector, slug }).count() > 0) {
      const isSlugAlreadySuffixed = !!newSlug;
      return findUnusedSlug(
        {
          newSlug: isSlugAlreadySuffixed
            ? incrementSuffixedSlug(slug)
            : addSuffixToSlug(slug)
        },
        scopeSelector
      );
    }
    return slug;
  };
  return findUnusedSlug;
};
