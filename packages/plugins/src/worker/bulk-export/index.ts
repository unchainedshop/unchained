import {
  WorkerDirector,
  WorkerAdapter,
  type IWorkerAdapter,
} from '@unchainedshop/core';
import { createLogger } from '@unchainedshop/logger';
import exportProducts from './exportProducts.ts';
import exportAssortments from './exportAssortments.ts';
import exportFilters from './exportFilters.ts';

const logger = createLogger('unchained:bulk-export');

const handlers = {
  ASSORTMENTS: exportAssortments,
  FILTERS: exportFilters,
  PRODUCTS: exportProducts,
};

export const BulkExportWorker: IWorkerAdapter<any, any> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.bulk-export',
  label: 'Bulk Export',
  version: '2.1.0',
  type: 'BULK_EXPORT',
  maxParallelAllocations: 1,

  doWork: async ({ type, ...params }, unchainedAPI) => {
    try {
      const handler = handlers[type];
      if (!handler) throw new Error(`Unsupported export type: ${type}`);

      const files = await handler(params, unchainedAPI);
      return { success: true, result: { files } };
    } catch (err: any) {
      logger.error(err);
      return {
        success: false,
        error: { name: err.name, message: err.message, stack: err.stack },
      };
    }
  },
};

WorkerDirector.registerAdapter(BulkExportWorker);
