import { WorkerDirector } from 'meteor/unchained:core-worker';
import WorkerPlugin from 'meteor/unchained:core-worker/workers/base';
import { createLogger } from 'meteor/unchained:core-logger';
import { MessagingDirector } from '../director';

const logger = createLogger('unchained:core-messaging');

class Message extends WorkerPlugin {
  static key = 'shop.unchained.worker-plugin.message';

  static label =
    'Send Message by combining payload with a template and start concrete jobs';

  static version = '1.0';

  static type = 'MESSAGE';

  static async doWork({ template, ...payload }, { _id } = {}) {
    try {
      const resolver = MessagingDirector.resolvers.get(template);
      const workConfigurations = await resolver({ template, ...payload });
      if (workConfigurations.length > 0) {
        const forked = await Promise.all(
          workConfigurations.map(async (workConfiguration) => {
            // eslint-disable-next-line
            const { input, ...work } = await WorkerDirector.addWork({
              ...workConfiguration,
              originalWorkId: _id,
            });
            return work;
          })
        );
        return { success: true, result: { forked } };
      }
      return { success: true, result: { info: 'Skipped Message' } };
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
