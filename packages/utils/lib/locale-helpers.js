import { Locales, Locale } from 'locale';
var _a = process.env, _b = _a.UNCHAINED_LANG, UNCHAINED_LANG = _b === void 0 ? 'de' : _b, _c = _a.UNCHAINED_COUNTRY, UNCHAINED_COUNTRY = _c === void 0 ? 'CH' : _c;
export var systemLocale = new Locale(UNCHAINED_LANG + "-" + UNCHAINED_COUNTRY);
export var resolveBestSupported = function (acceptLanguage, supportedLocales) {
    var acceptLocale = new Locales(acceptLanguage);
    var bestLocale = acceptLocale.best(supportedLocales);
    if (!bestLocale)
        return systemLocale;
    return bestLocale;
};
export var resolveBestCountry = function (localeCountry, shopCountry, countries) {
    if (shopCountry) {
        var resolvedCountry = countries.reduce(function (lastResolved, country) {
            if (shopCountry === country.isoCode) {
                return country.isoCode;
            }
            return lastResolved;
        }, null);
        if (resolvedCountry) {
            return resolvedCountry;
        }
    }
    return localeCountry || systemLocale.country;
};
export var resolveUserRemoteAddress = function (req) {
    var _a, _b, _c, _d;
    var remoteAddress = req.headers['x-real-ip'] ||
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    var remotePort = ((_a = req.connection) === null || _a === void 0 ? void 0 : _a.remotePort) ||
        ((_b = req.socket) === null || _b === void 0 ? void 0 : _b.remotePort) ||
        ((_d = (_c = req.connection) === null || _c === void 0 ? void 0 : _c.socket) === null || _d === void 0 ? void 0 : _d.remotePort);
    return { remoteAddress: remoteAddress, remotePort: remotePort };
};
//# sourceMappingURL=locale-helpers.js.map