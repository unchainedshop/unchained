import { IWorkerAdapter } from '@unchainedshop/types/worker';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import { BaseWorkerPlugin } from './base';

export const ExternalWorkerPlugin: IWorkerAdapter<void, void> = {
  ...BaseWorkerPlugin,

  key: 'shop.unchained.worker-plugin.external',
  label: 'External plugin as a placeholder for workers who interact with the system only via GraphQL',
  version: '1.0',
  type: 'EXTERNAL',

  async doWork() {
    throw new Error('Cannot do work for external workers');
  },
};

WorkerDirector.registerAdapter(ExternalWorkerPlugin);
