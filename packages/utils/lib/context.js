var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { AsyncLocalStorage } from 'async_hooks';
export var asyncLocalStorage = new AsyncLocalStorage();
export default (function () { return asyncLocalStorage.getStore(); });
export var withContext = function (context) {
    return function (middleware) {
        return function (req, res) {
            var rest = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                rest[_i - 2] = arguments[_i];
            }
            asyncLocalStorage.run(context({ req: req, res: res }), function () {
                middleware.apply(void 0, __spreadArray([req, res], rest, false));
            });
        };
    };
};
//# sourceMappingURL=context.js.map