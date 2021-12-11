import { WorkerDirector, WorkerPlugin } from 'meteor/unchained:core-worker';
import { createLogger } from 'meteor/unchained:logger';
import { Email } from 'meteor/email';

const logger = createLogger('unchained:core-worker');

const EmailWorkerPlugin: WorkerPlugin<
  { from?: string; to?: string; subject?: string; [x: string]: any },
  void
> = {
  key: 'shop.unchained.worker-plugin.email',
  label: 'Send a Mail through Meteor Mailer',
  version: '1.0',
  type: 'EMAIL',

  async doWork({ from, to, subject, ...rest } = {}) {
    logger.debug(`${this.key} -> doWork: ${from} -> ${to} (${subject})`);

    if (!to) {
      return {
        success: false,
        error: {
          name: 'RECIPIENT_REQUIRED',
          message: 'EMAIL requires a to',
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
  },
};

WorkerDirector.registerPlugin(EmailWorkerPlugin);

export default EmailWorkerPlugin;
