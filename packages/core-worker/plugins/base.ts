import { IWorkerAdapter } from '@unchainedshop/types/worker';
import { log, LogLevel } from 'meteor/unchained:logger';

export const BaseWorkerPlugin: Omit<IWorkerAdapter<any, void>, 'key' | 'label' | 'type' | 'version'> = {
  async doWork() {
    return { success: false, result: null };
  },

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};
