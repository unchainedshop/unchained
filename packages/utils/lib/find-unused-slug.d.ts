declare function _default(checkSlugIsUniqueFn: any, { slugify }?: {
    slugify?: typeof defaultSlugify;
}): ({ title, existingSlug, newSlug }: {
    title: any;
    existingSlug: any;
    newSlug: any;
}) => any;
export default _default;
