import { WorkerEventTypes, Work } from '@unchainedshop/core-worker';
import { IWorkerAdapter, UnchainedCore, WorkerAdapter, WorkerDirector } from '@unchainedshop/core';
import { subscribe } from '@unchainedshop/events';

export const ExportTokenWorker: IWorkerAdapter<void, void> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.export-token',
  label: 'External worker to hold the state of the minting/export process of tokens',
  version: '1.0.0',
  type: 'EXPORT_TOKEN',
  external: true,

  async doWork() {
    throw new Error('Cannot do work for external workers');
  },
};

export const configureExportToken = (unchainedAPI: UnchainedCore) => {
  subscribe<Work>(WorkerEventTypes.FINISHED, async ({ payload: work }) => {
    if (work.type === 'EXPORT_TOKEN' && work.success) {
      await unchainedAPI.modules.warehousing.updateTokenOwnership({
        tokenId: work.input.token._id,
        walletAddress: work.input.recipientWalletAddress,
      });
    }
  });
};

export default configureExportToken;

WorkerDirector.registerAdapter(ExportTokenWorker);
