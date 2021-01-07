import { WorkerPlugin } from 'meteor/unchained:core-worker';

console.warn(
  "@deprecated Use `import { WorkerPlugin } from 'meteor/unchained:core-worker';` instead"
);
/**
 * @deprecated Use `import { WorkerPlugin } from 'meteor/unchained:core-worker';` instead
 */
class DeprecatedWorkerPlugin extends WorkerPlugin {
  static key = '';

  static label = '';

  static version = '';

  static type = '';

  static async doWork() {
    return { success: false, result: null };
  }
}

export default DeprecatedWorkerPlugin;
