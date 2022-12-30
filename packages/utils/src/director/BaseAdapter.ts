import { IBaseAdapter } from '@unchainedshop/types/common.js';
import { log, LogLevel } from '@unchainedshop/logger';

export const BaseAdapter: Omit<IBaseAdapter, 'key' | 'label' | 'version'> = {
  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};
