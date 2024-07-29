import { log, LogLevel } from '@unchainedshop/logger';
import type { IBaseAdapter } from '@unchainedshop/utils';
import type { UnchainedCore } from '@unchainedshop/core';
export interface WorkResult<Result> {
  success: boolean;
  result?: Result;
  error?: any;
}

export type IWorkerAdapter<Input, Output> = IBaseAdapter & {
  type: string;
  external: boolean;
  maxParallelAllocations?: number;

  doWork: (input: Input, unchainedAPI: UnchainedCore, workId: string) => Promise<WorkResult<Output>>;
};

export const WorkerAdapter: Omit<IWorkerAdapter<any, void>, 'key' | 'label' | 'type' | 'version'> = {
  external: false,

  async doWork() {
    return { success: false, result: null };
  },

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};
