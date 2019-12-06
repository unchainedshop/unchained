import { WorkerDirector } from 'meteor/unchained:core-worker';
import WorkerPlugin from './base';

class ExternalWorkerPlugin extends WorkerPlugin {
  static key = 'shop.unchained.worker-plugin.external';

  static label =
    'External plugin as a placeholder for workers who interact with the system only via GraphQL';

  static version = '1.0';

  static type = 'EXTERNAL';

  static doWork() {
    throw new Error('Cannot do work for external workers');
  }
}

WorkerDirector.registerPlugin(ExternalWorkerPlugin);

export default ExternalWorkerPlugin;
