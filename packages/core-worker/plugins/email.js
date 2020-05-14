import { WorkerDirector } from 'meteor/unchained:core-worker';
import { createLogger } from 'meteor/unchained:core-logger';
import WorkerPlugin from './base';

const logger = createLogger('unchained:core-worker');

class SendEmailWorkerPlugin extends WorkerPlugin {
  static key = 'shop.unchained.worker-plugin.email';

  static label = 'Send a Mail through Meteor Mailer';

  static version = '1.0';

  static type = 'SEND_EMAIL';

  static async doWork({ from, to, subject, ...rest } = {}) {
    logger.debug(`${this.key} -> doWork: ${from} -> ${to} (${subject})`);

    if (!to) {
      return {
        success: false,
        error: {
          name: 'RECIPIENT_REQUIRED',
          message: 'SEND_EMAIL requires a to',
        },
      };
    }

    try {
      // https://docs.meteor.com/api/email.html#Email-send
      const result = Email.send({
        from,
        to,
        subject,
        ...rest,
      });
      return { success: true, result };
    } catch (err) {
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

WorkerDirector.registerPlugin(SendEmailWorkerPlugin);

export default SendEmailWorkerPlugin;
