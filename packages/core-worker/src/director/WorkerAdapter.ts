import { log, LogLevel } from '@unchainedshop/logger';
import { IWorkerAdapter, Output, WorkResult } from '../types.js';

export const WorkerAdapter: Omit<IWorkerAdapter<any, void>, 'key' | 'label' | 'type' | 'version'> = {
  external: false,

  async doWork(): Promise<WorkResult<Output>> {
    return { success: false, result: null };
  },

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};
