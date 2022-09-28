import { IWorkerAdapter } from '@unchainedshop/types/worker';
import { WorkerDirector, WorkerAdapter } from '@unchainedshop/core-worker';

export const ExportTokenWorker: IWorkerAdapter<void, void> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.export-token',
  label: 'External worker to hold the state of the minting/export process of tokens',
  version: '1.0',
  type: 'EXPORT_TOKEN',
  external: true,

  async doWork() {
    throw new Error('Cannot do work for external workers');
  },
};

WorkerDirector.registerAdapter(ExportTokenWorker);
