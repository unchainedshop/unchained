var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import Transport from 'winston-transport';
var LocalTransport = /** @class */ (function (_super) {
    __extends(LocalTransport, _super);
    function LocalTransport(Logs) {
        var _this = this;
        _this.Logs = Logs;
        return _this;
    }
    LocalTransport.prototype.log = function (info, callback) {
        var _this = this;
        setImmediate(function () {
            _this.emit('logged', info);
        });
        // eslint-disable-next-line
        var formattedLevel = info.level, message = info.message, meta = __rest(info, ["level", "message"]);
        var level = info[Symbol["for"]('level')];
        setTimeout(function () {
            try {
                Logs.insert({
                    created: new Date(),
                    level: level,
                    message: message,
                    meta: meta
                });
            }
            catch (e) {
                console.trace(e); // eslint-disable-line
            }
        }, 0);
        callback();
    };
    return LocalTransport;
}(Transport));
export { LocalTransport };
//# sourceMappingURL=LocalTransport.js.map