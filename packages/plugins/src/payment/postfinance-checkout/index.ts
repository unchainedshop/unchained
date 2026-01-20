import type { IPlugin } from '@unchainedshop/core';
import { PostfinanceCheckout } from './adapter.ts';
import { postfinanceCheckoutWebhookHandler } from './webhook.ts';

const { PFCHECKOUT_WEBHOOK_PATH = '/payment/postfinance-checkout' } = process.env;

// Plugin definition
export const PostfinanceCheckoutPlugin: IPlugin = {
  key: 'shop.unchained.payment.postfinance-checkout',
  label: 'Postfinance Checkout Payment Plugin',
  version: '1.0.0',

  adapters: [PostfinanceCheckout],

  routes: [
    {
      path: PFCHECKOUT_WEBHOOK_PATH,
      method: 'POST',
      handler: postfinanceCheckoutWebhookHandler,
    },
  ],

  onRegister: () => {
    const {
      PFCHECKOUT_SPACE_ID,
      PFCHECKOUT_USER_ID,
      PFCHECKOUT_SECRET,
      PFCHECKOUT_SUCCESS_URL,
      PFCHECKOUT_FAILED_URL,
    } = process.env;

    if (
      !PFCHECKOUT_SPACE_ID ||
      !PFCHECKOUT_USER_ID ||
      !PFCHECKOUT_SECRET ||
      !PFCHECKOUT_SUCCESS_URL ||
      !PFCHECKOUT_FAILED_URL
    ) {
      throw new Error('Postfinance Checkout environment variables not fully configured');
    }
  },
};

export default PostfinanceCheckoutPlugin;

// Re-export adapter for direct use
export { PostfinanceCheckout } from './adapter.ts';

// Type and utility exports
export * from './types.ts';
export * from './api-types.ts';
export * from './utils.ts';
