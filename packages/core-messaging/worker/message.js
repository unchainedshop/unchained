import { WorkerDirector } from 'meteor/unchained:core-worker';
import WorkerPlugin from 'meteor/unchained:core-worker/workers/base';
import { MessagingDirector } from '../director';

class Message extends WorkerPlugin {
  static key = 'shop.unchained.worker-plugin.message';

  static label = 'Send Message';

  static version = '1.0';

  static type = 'MESSAGE';

  static async doWork({ template, ...payload }) {
    const resolver = MessagingDirector.resolvers.get(template);
    const inputs = await resolver({ template, ...payload });
    return Promise.all(inputs.map(WorkerDirector.doWork));
  }
}

export default Message;
