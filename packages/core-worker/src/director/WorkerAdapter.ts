import { log, LogLevel } from '@unchainedshop/logger';
import { IBaseAdapter } from '@unchainedshop/utils';
export interface WorkResult<Result> {
  success: boolean;
  result?: Result;
  error?: any;
}

export type IWorkerAdapter<Input, Output> = IBaseAdapter & {
  type: string;
  external: boolean;
  maxParallelAllocations?: number;

  doWork: (input: Input, unchainedAPI, workId: string) => Promise<WorkResult<Output>>;
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
