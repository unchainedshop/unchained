import { type IWorkerAdapter, WorkerAdapter, WorkerDirector } from '@unchainedshop/core';

const { BULKGATE_APPLICATION_ID, BULKGATE_APPLICATION_TOKEN } = process.env;

// BulkGate Simple API for SMS (transactional by default, promotional via boolean)
const BulkGateWorker: IWorkerAdapter<
  {
    from?: string;
    to?: string;
    text?: string;
    unicode?: boolean;
    country?: string;
    schedule?: string | number; // ISO 8601 format or Unix timestamp
    promotional?: boolean; // Set to true for promotional SMS, defaults to transactional
    [key: string]: any;
  },
  any
> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.bulkgate',
  label: 'Send SMS through BulkGate',
  version: '1.0.0',

  type: 'BULKGATE',

  doWork: async ({
    from,
    to,
    text,
    unicode = false,
    country,
    schedule,
    promotional = false,
    ...params
  }) => {
    try {
      // Choose API endpoint based on promotional flag
      const url = promotional
        ? 'https://portal.bulkgate.com/api/1.0/simple/promotional'
        : 'https://portal.bulkgate.com/api/1.0/simple/transactional';

      // Prepare the request body
      const requestBody = {
        application_id: BULKGATE_APPLICATION_ID,
        application_token: BULKGATE_APPLICATION_TOKEN,
        number: to, // Phone number in international format (or semicolon-separated for promotional)
        text: text || '',
        unicode: unicode, // Boolean value for unicode support
        sender_id: from ? 'gText' : 'gSystem', // Use text sender if 'from' is provided
        sender_id_value: from || '', // Custom sender name if using gText
        ...(country && { country }), // Optional country code
        ...(schedule && { schedule }), // Optional scheduled time
        ...params, // Any additional parameters
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      // Check if we have an error response
      if (responseData.error || responseData.type) {
        return {
          success: false,
          error: {
            name: 'BULKGATE_ERROR',
            message:
              responseData.error ||
              `Failed to send ${promotional ? 'promotional' : 'transactional'} SMS`,
            type: responseData.type || null,
            code: responseData.code || response.status,
            detail: responseData.detail || null,
          },
        };
      }

      // Success response (transactional has specific structure, promotional might vary)
      if (responseData.data) {
        // For transactional SMS, check for specific accepted status
        if (!promotional && responseData.data.status === 'accepted') {
          return {
            success: true,
            result: {
              sms_id: responseData.data.sms_id,
              price: responseData.data.price,
              credit: responseData.data.credit,
              number: responseData.data.number,
              status: responseData.data.status,
            },
            error: null,
          };
        }

        // For promotional SMS or other successful responses
        if (promotional || responseData.data.status) {
          return {
            success: true,
            result: responseData.data,
            error: null,
          };
        }
      }

      // Unexpected response format
      return {
        success: false,
        error: {
          name: 'BULKGATE_ERROR',
          message: 'Unexpected response format from BulkGate API',
          response: responseData,
        },
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

// Register the plugin
WorkerDirector.registerAdapter(BulkGateWorker);

// Environment variables needed:
// BULKGATE_APPLICATION_ID=your_application_id
// BULKGATE_APPLICATION_TOKEN=your_application_token
