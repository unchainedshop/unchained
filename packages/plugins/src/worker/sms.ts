import { IWorkerAdapter, WorkerAdapter, WorkerDirector } from '@unchainedshop/core';
import Twilio from 'twilio';

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM } = process.env;

/* Potential: no need for twilio npm
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
--data-urlencode "From=+15017122661" \
--data-urlencode "Body=Hi there" \
--data-urlencode "To=+15558675310" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
*/

const SmsWorkerPlugin: IWorkerAdapter<
  {
    from?: string;
    to?: string;
    text?: string;
  },
  any
> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.sms',
  label: 'Send a SMS through Twilio',
  version: '1.0.0',

  type: 'SMS',

  doWork: async ({ from, to, text }) => {
    if (!TWILIO_SMS_FROM && !from) {
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
      const { sid, errorMessage } = await client.messages.create({
        body: text,
        from: from || TWILIO_SMS_FROM,
        to,
      });
      if (errorMessage) {
        return {
          success: false,
          error: {
            name: 'TWILIO_ERROR',
            message: errorMessage.toString(),
          },
        };
      }
      return {
        success: true,
        result: {
          sid,
        },
        error: null,
      };
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
