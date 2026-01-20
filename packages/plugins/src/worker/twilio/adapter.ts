import { type IWorkerAdapter, WorkerAdapter } from '@unchainedshop/core';

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM } = process.env;

export const SmsWorkerPlugin: IWorkerAdapter<
  {
    from?: string;
    to: string;
    text: string;
    [key: string]: any; // Allow additional parameters
  },
  any
> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.twilio',
  label: 'Send Messages through Twilio',
  version: '1.0.0',

  type: 'TWILIO',

  doWork: async ({ from, to, text, ...params }) => {
    try {
      if (!TWILIO_SMS_FROM && !from)
        throw new Error(
          'Missing Twilio "from" number. Set TWILIO_SMS_FROM env var or provide "from" in input',
        );

      if (!to) throw new Error('Missing "to" in input');

      const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          Body: text || '',
          From: from || TWILIO_SMS_FROM!,
          To: to,
          ...params, // Include any additional parameters passed
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

export default SmsWorkerPlugin;
