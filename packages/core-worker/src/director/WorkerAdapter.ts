import { IWorkerAdapter } from '@unchainedshop/types/worker.js';
import { log, LogLevel } from '@unchainedshop/logger';

export const WorkerAdapter: Omit<IWorkerAdapter<any, void>, 'key' | 'label' | 'type' | 'version'> = {
  external: false,

  async doWork() {
    return { success: false, result: null };
  },

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};
