import { WorkerPlugin } from 'meteor/unchained:core-worker';

console.warn(
  "@deprecated Use `import { WorkerPlugin } from 'meteor/unchained:core-worker';` instead"
);
/**
 * @deprecated Use `import { WorkerPlugin } from 'meteor/unchained:core-worker';` instead
 */
const DeprecatedWorkerPlugin: WorkerPlugin<void, null> = {
  key: '',
  label: '',
  version: '',
  type: '',

  async doWork() {
    return { success: false, result: null };
  },
};

export default DeprecatedWorkerPlugin;
