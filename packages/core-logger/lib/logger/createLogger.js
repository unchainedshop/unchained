var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { createLogger as createWinstonLogger, format, transports } from 'winston';
import stringify from 'safe-stable-stringify';
import { LogLevel } from './LogLevel';
var _a = process.env, _b = _a.DEBUG, DEBUG = _b === void 0 ? '' : _b, _c = _a.LOG_LEVEL, LOG_LEVEL = _c === void 0 ? LogLevel.Info : _c, _d = _a.UNCHAINED_LOG_FORMAT, UNCHAINED_LOG_FORMAT = _d === void 0 ? 'unchained' : _d;
var combine = format.combine, label = format.label, timestamp = format.timestamp, colorize = format.colorize, printf = format.printf, json = format.json;
var debugStringContainsModule = function (debugString, moduleName) {
    var loggingMatched = debugString.split(',').reduce(function (accumulator, name) {
        if (accumulator === false)
            return accumulator;
        var nameRegex = name
            .replace('-', '\\-?')
            .replace(':*', '\\:?*')
            .replace('*', '.*');
        var regExp = new RegExp("^" + nameRegex + "$", 'm');
        if (regExp.test(moduleName)) {
            if (name.slice(0, 1) === '-') {
                // explicitly disable
                return false;
            }
            return true;
        }
        return accumulator;
    }, undefined);
    return loggingMatched || false;
};
var myFormat = printf(function (_a) {
    var level = _a.level, message = _a.message, _label = _a.label, _timestamp = _a.timestamp, rest = __rest(_a, ["level", "message", "label", "timestamp"]);
    var otherPropsString = stringify(rest);
    return _timestamp + " [" + _label + "] " + level + ": " + message + " " + otherPropsString;
});
var UnchainedLogFormats = {
    unchained: function (moduleName) {
        return combine(timestamp(), label({ label: moduleName }), colorize(), myFormat);
    },
    json: json
};
if (!UnchainedLogFormats[UNCHAINED_LOG_FORMAT.toLowerCase()]) {
    throw new Error("UNCHAINED_LOG_FORMAT is invalid, use one of " + Object.keys(UnchainedLogFormats).join(','));
}
export { transports, format };
export var createLogger = function (moduleName, moreTransports) {
    if (moreTransports === void 0) { moreTransports = []; }
    var loggingMatched = debugStringContainsModule(DEBUG, moduleName);
    return createWinstonLogger({
        transports: __spreadArray([
            new transports.Console({
                format: UnchainedLogFormats[UNCHAINED_LOG_FORMAT](moduleName),
                stderrLevels: [LogLevel.Error],
                consoleWarnLevels: [LogLevel.Warning],
                level: loggingMatched ? LogLevel.Debug : LOG_LEVEL
            })
        ], moreTransports, true)
    });
};
//# sourceMappingURL=createLogger.js.map