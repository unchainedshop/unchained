import { log, LogLevel } from '@unchainedshop/logger';

export interface IBaseAdapter {
  key: string;
  label: string;
  version: string;
  log: (
    message: string,
    options?: {
      level?: LogLevel;
      [x: string]: any;
    },
  ) => void;
}

export const BaseAdapter: Omit<IBaseAdapter, 'key' | 'label' | 'version'> = {
  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};
