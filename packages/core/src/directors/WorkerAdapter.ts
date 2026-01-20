import { BaseAdapter, type IBaseAdapter } from '@unchainedshop/utils';
import type { WorkResult } from '@unchainedshop/core-worker';
import type { ModuleOptions, Modules } from '../modules.ts';
import type { Services } from '../services/index.ts';
import type { BulkImporter } from '../bulk-importer/index.ts';
import type { BulkExporter } from '../bulk-exporter/index.ts';

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
      bulkExporter: BulkExporter;
    },
    workId: string,
  ) => Promise<WorkResult<Output>>;
};

export const WorkerAdapter: Omit<IWorkerAdapter<any, void>, 'key' | 'label' | 'type' | 'version'> = {
  ...BaseAdapter,
  adapterType: Symbol.for('unchained:adapter:worker'),
  external: false,

  async doWork() {
    return { success: false };
  },
};
