var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import LRU from 'lru-cache';
import { systemLocale } from './locale-helpers';
var NODE_ENV = process.env.NODE_ENV;
var maxAge = NODE_ENV === 'production' ? 1000 * 30 : -1; // 5 seconds or 1 second
var textCache = new LRU({
    max: 50000,
    maxAge: maxAge
});
var extendSelectorWithLocale = function (selector, locale) {
    var localeSelector = {
        locale: { $in: [locale.normalized, locale.language] }
    };
    return __assign(__assign({}, localeSelector), selector);
};
var findLocalizedText = function (collection, selector, locale) {
    var cacheKey = JSON.stringify({
        n: collection._name,
        s: selector,
        l: locale
    });
    var cachedText = textCache.get(cacheKey);
    if (cachedText)
        return cachedText;
    var exactTranslation = collection.findOne(extendSelectorWithLocale(selector, locale));
    if (exactTranslation) {
        textCache.set(cacheKey, exactTranslation);
        return exactTranslation;
    }
    if (systemLocale.normalized !== locale.normalized) {
        var fallbackTranslation = collection.findOne(extendSelectorWithLocale(selector, systemLocale));
        if (fallbackTranslation) {
            textCache.set(cacheKey, fallbackTranslation);
            return fallbackTranslation;
        }
    }
    var foundText = collection.findOne(selector);
    textCache.set(cacheKey, foundText);
    return foundText;
};
export default findLocalizedText;
//# sourceMappingURL=find-localized-text.js.map