import defaultSlugify from './slugify';
var DELIMITER = '-';
var addSuffixToSlug = function (slug, index, delimiter) {
    if (index === void 0) { index = 1; }
    if (delimiter === void 0) { delimiter = DELIMITER; }
    return "" + slug + delimiter + index;
};
var incrementSuffixedSlug = function (slugIncludingSuffix, delimiter) {
    if (delimiter === void 0) { delimiter = DELIMITER; }
    var slugParts = slugIncludingSuffix.split(delimiter);
    var suffixedIndex = parseInt(slugParts.pop(), 10);
    var slugWithoutSuffix = slugParts.join(delimiter);
    return addSuffixToSlug(slugWithoutSuffix, suffixedIndex + 1);
};
export default (function (checkSlugIsUniqueFn, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.slugify, slugify = _c === void 0 ? defaultSlugify : _c;
    var findUnusedSlug = function (_a) {
        var title = _a.title, existingSlug = _a.existingSlug, newSlug = _a.newSlug;
        var slug = newSlug || existingSlug || "" + slugify(title);
        if (!checkSlugIsUniqueFn(slug)) {
            var isSlugAlreadySuffixed = !!newSlug;
            return findUnusedSlug({
                newSlug: isSlugAlreadySuffixed
                    ? incrementSuffixedSlug(slug)
                    : addSuffixToSlug(slug)
            });
        }
        return slug;
    };
    return findUnusedSlug;
});
//# sourceMappingURL=find-unused-slug.js.map