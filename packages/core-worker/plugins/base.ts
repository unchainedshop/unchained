import { IWorkerAdapter } from '@unchainedshop/types/worker';
import { log, LogLevel } from 'meteor/unchained:logger';

export const BaseWorkerPlugin: IWorkerAdapter<any, void> = {
  key: '',
  label: '',
  version: '',
  type: '',

  async doWork() {
    return { success: false, result: null };
  },

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};
