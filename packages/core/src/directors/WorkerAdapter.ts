import { BaseAdapter, IBaseAdapter } from '@unchainedshop/utils';
import { WorkResult } from '@unchainedshop/core-worker';
import { ModuleOptions, Modules } from '../modules.js';
import { Services } from '../services/index.js';
import { BulkImporter } from '../bulk-importer/createBulkImporter.js';

export type IWorkerAdapter<Input, Output> = IBaseAdapter & {
  type: string;
  external: boolean;
  maxParallelAllocations?: number;

  doWork: (
    input: Input,
    unchainedAPI: {
      modules: Modules;
      services: Services;
      bulkImporter: BulkImporter;
      options: ModuleOptions;
    },
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
