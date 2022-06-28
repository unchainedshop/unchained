import { WorkerDirector, WorkerAdapter } from '@unchainedshop/core-worker';
import { createLogger } from '@unchainedshop/logger';
import { Email } from 'meteor/email';
import { IWorkerAdapter } from '@unchainedshop/types/worker';

const logger = createLogger('unchained:plugins:worker:email');

const EmailWorkerPlugin: IWorkerAdapter<
  {
    from?: string;
    to?: string;
    subject?: string;
    [x: string]: any;
  },
  void
> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.email',
  label: 'Send a Mail through Meteor Mailer',
  version: '1.0',

  type: 'EMAIL',

  doWork: async ({ from, to, subject, ...rest }) => {
    logger.debug(`${EmailWorkerPlugin.key} -> doWork: ${from} -> ${to} (${subject})`);

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

WorkerDirector.registerAdapter(EmailWorkerPlugin);
