export declare enum LogTextColor {
    Black = "30",
    Red = "31",
    Green = "32",
    Yellow = "33",
    Blue = "34",
    Magenta = "35",
    Cyan = "36",
    White = "37",
    Crimson = "38"
}
export declare enum LogBackgroundColor {
    Black = "40",
    Red = "41",
    Green = "42",
    Yellow = "43",
    Blue = "44",
    Magenta = "45",
    Cyan = "46",
    White = "47"
}
export declare enum LogTextStyle {
    Bold = "1",
    Italic = "3",
    Underscore = "4"
}
export declare type LogSettings = {
    color?: LogTextColor;
    background?: LogBackgroundColor;
    style?: LogTextStyle;
};
export declare const log: (text: string, settings?: LogSettings) => void;
