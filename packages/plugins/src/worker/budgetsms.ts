import { IWorkerAdapter, WorkerAdapter, WorkerDirector } from '@unchainedshop/core';

const { BUDGETSMS_USERNAME, BUDGETSMS_USERID, BUDGETSMS_HANDLE } = process.env;

// BudgetSMS Plugin - Verified against official API documentation
// Note: BudgetSMS API has a quirk where it returns error 1001 (authentication failed)
// when you have insufficient credit, instead of the correct error 1003.
const BudgetSMSWorker: IWorkerAdapter<
  {
    from?: string;
    to?: string;
    text?: string;
    test?: boolean; // If true, uses test endpoint (no credit deducted)
    customid?: string;
    price?: boolean; // Include price info in response
    mccmnc?: boolean; // Include carrier info in response
    credit?: boolean; // Include remaining credit in response
    [key: string]: any;
  },
  any
> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.budgetsms',
  label: 'Send Messages through BudgetSMS',
  version: '1.0.0',

  type: 'BUDGETSMS',

  doWork: async ({
    from,
    to,
    text,
    test = false,
    customid,
    price = false,
    mccmnc = false,
    credit = false,
    ...params
  }) => {
    try {
      // Validate credentials
      if (!BUDGETSMS_USERNAME || !BUDGETSMS_USERID || !BUDGETSMS_HANDLE) {
        throw new Error(
          'Missing BudgetSMS credentials. Please set BUDGETSMS_USERNAME, BUDGETSMS_USERID, and BUDGETSMS_HANDLE',
        );
      }

      // Trim credentials to remove any whitespace
      const username = BUDGETSMS_USERNAME.trim();
      const userid = BUDGETSMS_USERID.trim();
      const handle = BUDGETSMS_HANDLE.trim();

      // Validate userid is numeric only
      if (!/^\d+$/.test(userid)) {
        throw new Error('BUDGETSMS_USERID must be numeric only. Found: ' + userid);
      }

      // Choose endpoint based on test mode
      const url = test ? 'https://api.budgetsms.net/testsms/' : 'https://api.budgetsms.net/sendsms/';

      // Format phone number according to E.164 (no + or 00, no spaces/dashes)
      const formattedTo = to.replace(/^\+|^00/, '').replace(/[\s-]/g, '');

      // Build query parameters
      const queryParams = new URLSearchParams({
        username: username,
        userid: userid,
        handle: handle,
        msg: text || '', // Note: parameter is 'msg' not 'text'
        from: from || '',
        to: formattedTo,
        ...(customid && { customid }),
        ...(!test && price && { price: '1' }), // Price info only for real sends
        ...(!test && mccmnc && { mccmnc: '1' }), // Carrier info only for real sends
        ...(!test && credit && { credit: '1' }), // Credit info only for real sends
        ...params,
      });

      // Make GET request
      const fullUrl = `${url}?${queryParams.toString()}`;

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          Accept: 'text/plain',
          'User-Agent': 'Unchained/BudgetSMS-Plugin',
        },
      });

      const responseText = await response.text().then((text) => text.trim());

      // Parse response: "OK <smsid> [price] [parts] [mccmnc] [credit]" or "ERR <errorcode>"
      if (responseText.startsWith('OK')) {
        const parts = responseText.split(' ');
        const result: any = {
          sms_id: parts[1] || null,
          status: test ? 'test_successful' : 'sent',
          test_mode: test,
        };

        if (test) {
          result.message = 'Test SMS validated successfully (no credit deducted)';
        } else {
          // Parse additional info based on parameters used
          let index = 2;
          if (price && parts[index] && parts[index + 1]) {
            result.price = parseFloat(parts[index]);
            result.parts = parseInt(parts[index + 1]);
            index += 2;
          }
          if (mccmnc && parts[index]) {
            result.mccmnc = parts[index];
            index += 1;
          }
          if (credit && parts[index]) {
            result.remaining_credit = parseFloat(parts[index]);
          }
        }

        return {
          success: true,
          result,
          error: null,
        };
      }

      if (responseText.startsWith('ERR')) {
        const parts = responseText.split(' ');
        const errorCode = parts[1] || 'UNKNOWN';

        // Error code mappings from documentation
        const errorMessages: Record<string, string> = {
          '1001': 'Authentication failed OR insufficient credit (BudgetSMS returns 1001 for both)',
          '1002': 'Account not active',
          '1003': 'Insufficient credit',
          '1004': 'No access to this API',
          '1005': 'No handle provided',
          '1006': 'No UserID provided',
          '1007': 'No Username provided',
          '2001': 'SMS message text is empty',
          '2002': 'SMS numeric senderid can be max. 16 numbers',
          '2003': 'SMS alphanumeric sender can be max. 11 characters',
          '2004': 'SMS senderid is empty or invalid',
          '2005': 'Destination number is too short',
          '2006': 'Destination is not numeric',
          '2007': 'Destination is empty',
          '2008': 'SMS text is not OK (check encoding?)',
          '2009': 'Parameter issue',
          '2010': 'Destination number is invalidly formatted',
          '2011': 'Destination is invalid',
          '2012': 'SMS message text is too long',
          '2013': 'SMS message is invalid',
          '2014': 'SMS CustomID is used before',
          '2015': 'Charset problem',
          '2016': 'Invalid UTF-8 encoding',
          '3001': 'No route to destination',
          '3002': 'No routes are setup',
          '3003': 'Invalid destination',
          '4001': 'System error, related to customid',
          '4002': 'System error, temporary issue',
        };

        // Special handling for 1001 error
        let message = errorMessages[errorCode] || `Unknown error code: ${errorCode}`;
        if (errorCode === '1001') {
          message += '. Note: Check your account balance - BudgetSMS may return 1001 when credit is 0.';
        }

        return {
          success: false,
          error: {
            name: 'BUDGETSMS_ERROR',
            code: errorCode,
            message,
          },
        };
      }

      // Unexpected response
      return {
        success: false,
        error: {
          name: 'BUDGETSMS_ERROR',
          message: 'Unexpected response format from BudgetSMS API',
          response: responseText,
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

WorkerDirector.registerAdapter(BudgetSMSWorker);

// Environment variables needed:
// BUDGETSMS_USERNAME=your_username (alphanumeric)
// BUDGETSMS_USERID=your_userid (NUMERIC ONLY - found in BudgetSMS control panel)
// BUDGETSMS_HANDLE=your_api_handle (alphanumeric - found in BudgetSMS control panel)

// IMPORTANT: The userid MUST be numeric only. You can find it in the BudgetSMS control panel after login.
// Example: BUDGETSMS_USERID=12345 (NOT "user12345" or any non-numeric value)

// Usage examples:
//
// Send real SMS (requires credits):
// await WorkerDirector.doWork({
//   type: 'BUDGETSMS',
//   from: 'YourCompany',
//   to: '+41791234567',
//   text: 'Your message here',
//   price: true, // Get price info
//   credit: true, // Get remaining credit
// });
//
// Test SMS (no credit deducted):
// await WorkerDirector.doWork({
//   type: 'BUDGETSMS',
//   test: true,
//   from: 'YourCompany',
//   to: '+41791234567',
//   text: 'Test message',
// });
//
// IMPORTANT: If you get error 1001, it could mean either:
// 1. Authentication failed (wrong credentials)
// 2. Insufficient credit (0 balance)
// Use the checkBudgetSmsCredentials() helper to verify which one it is.

// Helper function to check credentials and balance
export async function checkBudgetSmsCredentials() {
  const url = 'https://api.budgetsms.net/checkcredit/';
  const username = process.env.BUDGETSMS_USERNAME?.trim();
  const userid = process.env.BUDGETSMS_USERID?.trim();
  const handle = process.env.BUDGETSMS_HANDLE?.trim();

  if (!username || !userid || !handle) {
    return { error: 'Missing credentials' };
  }

  if (!/^\d+$/.test(userid)) {
    return { error: 'UserID must be numeric only' };
  }

  const queryParams = new URLSearchParams({ username, userid, handle });

  try {
    const response = await fetch(`${url}?${queryParams.toString()}`, { method: 'GET' });
    const text = await response.text();

    if (text.startsWith('OK')) {
      const credit = parseFloat(text.split(' ')[1]) || 0;
      return { success: true, credit };
    } else {
      return { error: text };
    }
  } catch (err) {
    return { error: err.message };
  }
}
