export var LogTextColor;
(function (LogTextColor) {
    LogTextColor["Black"] = "30";
    LogTextColor["Red"] = "31";
    LogTextColor["Green"] = "32";
    LogTextColor["Yellow"] = "33";
    LogTextColor["Blue"] = "34";
    LogTextColor["Magenta"] = "35";
    LogTextColor["Cyan"] = "36";
    LogTextColor["White"] = "37";
    LogTextColor["Crimson"] = "38";
})(LogTextColor || (LogTextColor = {}));
export var LogBackgroundColor;
(function (LogBackgroundColor) {
    LogBackgroundColor["Black"] = "40";
    LogBackgroundColor["Red"] = "41";
    LogBackgroundColor["Green"] = "42";
    LogBackgroundColor["Yellow"] = "43";
    LogBackgroundColor["Blue"] = "44";
    LogBackgroundColor["Magenta"] = "45";
    LogBackgroundColor["Cyan"] = "46";
    LogBackgroundColor["White"] = "47";
})(LogBackgroundColor || (LogBackgroundColor = {}));
export var LogTextStyle;
(function (LogTextStyle) {
    LogTextStyle["Bold"] = "1";
    LogTextStyle["Italic"] = "3";
    LogTextStyle["Underscore"] = "4";
})(LogTextStyle || (LogTextStyle = {}));
var Log = {
    Reset: '\x1b[0m',
    Start: '\x1b['
};
export var log = function (text, settings) {
    if (settings) {
        var logStyles = [settings.color || ''];
        logStyles.push(settings.background || '');
        logStyles.push(settings.style || '');
        var logStyle = logStyles.filter(function (v) { return v > ''; }).join(';');
        var logStyleStr = "" + Log.Start + logStyle + "m%s" + Log.Reset;
        console.log(logStyleStr, text);
    }
    else {
        console.log(text);
    }
};
//# sourceMappingURL=log.js.map