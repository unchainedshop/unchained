import { WorkerDirector } from 'meteor/unchained:core-worker';
import WorkerPlugin from 'meteor/unchained:core-worker/workers/base';
import { createLogger } from 'meteor/unchained:core-logger';
import { MessagingDirector } from '../director';

const logger = createLogger('unchained:core-messaging');

class Message extends WorkerPlugin {
  static key = 'shop.unchained.worker-plugin.message';

  static label = 'Send Message';

  static version = '1.0';

  static type = 'MESSAGE';

  static async doWork({ template, ...payload }) {
    try {
      const resolver = MessagingDirector.resolvers.get(template);
      const workConfigurations = await resolver({ template, ...payload });

      if (workConfigurations.length === 1) {
        // just forward
        const wrappedConfiguration = workConfigurations[0];
        const wrappedResult = await WorkerDirector.doWork(wrappedConfiguration);
        return {
          success: wrappedResult.success,
          result: {
            wrappedConfiguration,
            ...wrappedResult.result,
          },
          error: wrappedResult.error,
        };
      }
      if (workConfigurations.length > 0) {
        // split to many
        const derivedWork = workConfigurations.map(({ type, input }) => {
          return WorkerDirector.addWork({
            type,
            input,
          });
        });
        return { success: true, result: derivedWork };
      }
      return { success: false, result: 'Skipped Message' };
    } catch (err) {
      logger.warn(err.stack);
      return {
        success: false,
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
      };
    }
  }
}

export default Message;
