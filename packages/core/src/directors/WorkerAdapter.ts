import { BaseAdapter, IBaseAdapter } from '@unchainedshop/utils';
import { WorkResult } from '@unchainedshop/core-worker';
import { Modules } from '../modules.js';
import { Services } from '../services/index.js';
import { BulkImporter } from '../core-index.js';

export type IWorkerAdapter<Input, Output> = IBaseAdapter & {
  type: string;
  external: boolean;
  maxParallelAllocations?: number;

  doWork: (
    input: Input,
    unchainedAPI: { modules: Modules; services: Services; bulkImporter: BulkImporter },
    workId: string,
  ) => Promise<WorkResult<Output>>;
};

export const WorkerAdapter: Omit<IWorkerAdapter<any, void>, 'key' | 'label' | 'type' | 'version'> = {
  ...BaseAdapter,
  external: false,

  async doWork() {
    return { success: false, result: null };
  },
};
