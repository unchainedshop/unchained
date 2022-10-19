import { IWorkerAdapter } from '@unchainedshop/types/worker';
import { WorkerDirector, WorkerAdapter, WorkerEventTypes } from '@unchainedshop/core-worker';
import { UnchainedCore } from '@unchainedshop/types/core';

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

export const configureExportToken = (unchainedApi: UnchainedCore) => {
  WorkerDirector.events.on(WorkerEventTypes.FINISHED, async ({ work }) => {
    if (work.type === 'EXPORT_TOKEN' && work.success) {
      await unchainedApi.modules.warehousing.updateTokenOwnership({
        tokenId: work.input.token._id,
        userId: null,
        walletAddress: work.input.recipientWalletAddress,
      });
    }
  });
};

export default configureExportToken;

WorkerDirector.registerAdapter(ExportTokenWorker);
