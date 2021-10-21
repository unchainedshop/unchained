export enum LogTextColor {
  Black = '30',
  Red = '31',
  Green = '32',
  Yellow = '33',
  Blue = '34',
  Magenta = '35',
  Cyan = '36',
  White = '37',
  Crimson = '38',
}
export enum LogBackgroundColor {
  Black = '40',
  Red = '41',
  Green = '42',
  Yellow = '43',
  Blue = '44',
  Magenta = '45',
  Cyan = '46',
  White = '47',
}

export enum LogTextStyle {
  Bold = '1',
  Italic = '3',
  Underscore = '4',
}

const Log = {
  Reset: '\x1b[0m',
  Start: '\x1b[',
};

export type LogSettings = {
  color?: LogTextColor;
  background?: LogBackgroundColor;
  style?: LogTextStyle;
};

export const log = (text: string, settings?: LogSettings) => {
  if (settings) {
    const logStyles = [settings.color || ''];
    logStyles.push(settings.background || '');
    logStyles.push(settings.style || '');

    const logStyle = logStyles.filter((v) => v > '').join(';');
    const logStyleStr = `${Log.Start}${logStyle}m%s${Log.Reset}`;
    console.log(logStyleStr, text);
  } else {
    console.log(text);
  }
};
