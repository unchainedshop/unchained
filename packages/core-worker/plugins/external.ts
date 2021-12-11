import { WorkerDirector, WorkerPlugin } from 'meteor/unchained:core-worker';

const ExternalWorkerPlugin: WorkerPlugin<void, void> = {
  key: 'shop.unchained.worker-plugin.external',
  label:
    'External plugin as a placeholder for workers who interact with the system only via GraphQL',
  version: '1.0',
  type: 'EXTERNAL',

  async doWork() {
    throw new Error('Cannot do work for external workers');
  },
};

WorkerDirector.registerPlugin(ExternalWorkerPlugin);

export default ExternalWorkerPlugin;
