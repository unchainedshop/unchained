import { IWorkerAdapter, WorkerAdapter, WorkerDirector } from '@unchainedshop/core';

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM } = process.env;

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
      const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          Body: text || '',
          From: from || TWILIO_SMS_FROM,
          To: to,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            name: 'TWILIO_ERROR',
            message: data.message || 'Failed to send SMS',
          },
        };
      }

      return {
        success: true,
        result: {
          sid: data.sid,
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
