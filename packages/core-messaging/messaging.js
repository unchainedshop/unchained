import { WorkerDirector } from 'meteor/unchained:core-worker';
import MessageWorker from './worker/message';

export * from './director';

export default () => {
  // configure
  WorkerDirector.registerPlugin(MessageWorker);
};
