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

export default (
  checkSlugIsUniqueFn: (slug: string) => Promise<boolean>,
  { slugify }: { slugify: (text: string) => string },
): ((params: { title?: string; existingSlug?: string; newSlug?: string }) => Promise<string>) => {
  const findUnusedSlug = async ({
    title,
    existingSlug,
    newSlug,
  }: {
    title: string;
    existingSlug?: string;
    newSlug?: string;
  }) => {
    const slug = newSlug || existingSlug || `${slugify(title)}`;
    if (!(await checkSlugIsUniqueFn(slug))) {
      const isSlugAlreadySuffixed = !!newSlug;
      return findUnusedSlug({
        title,
        existingSlug,
        newSlug: isSlugAlreadySuffixed ? incrementSuffixedSlug(slug) : addSuffixToSlug(slug),
      });
    }
    return slug;
  };
  return findUnusedSlug;
};
