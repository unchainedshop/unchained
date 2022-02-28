import { WorkerDirector } from 'meteor/unchained:core-worker';
import { createLogger } from 'meteor/unchained:logger';
import { IWorkerAdapter } from '@unchainedshop/types/worker';
import Twilio from 'twilio';
import { BaseWorkerPlugin } from './base';

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM } = process.env;

const logger = createLogger('unchained:core-worker');

const SmsWorkerPlugin: IWorkerAdapter<
  {
    from?: string;
    to?: string;
    text?: string;
  },
  any
> = {
  ...BaseWorkerPlugin,

  key: 'shop.unchained.worker-plugin.sms',
  label: 'Send a SMS through Twilio',
  version: '1.0',

  type: 'SMS',

  doWork: async ({ from, to, text }) => {
    logger.debug(`${SmsWorkerPlugin.key} -> doWork: ${from} -> ${to}`);

    if (!TWILIO_SMS_FROM) {
      return {
        success: false,
        error: {
          name: 'SENDER_REQUIRED',
          message: 'SMS requires a from, TWILIO_SMS_FROM not set',
        },
      };
    }

    if (!to) {
      return {
        success: false,
        error: {
          name: 'RECIPIENT_REQUIRED',
          message: 'SMS requires a to',
        },
      };
    }

    try {
      const client = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      const result = await client.messages.create({
        body: text,
        from: TWILIO_SMS_FROM,
        to,
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

WorkerDirector.registerAdapter(SmsWorkerPlugin);
