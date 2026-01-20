import { type IPlugin } from '@unchainedshop/core';
import { PaymentFreePrice } from './adapter.ts';

// Plugin definition
export const PaymentFreePricePlugin: IPlugin = {
  key: 'shop.unchained.pricing.payment-free',
  label: 'Free Payment Pricing Plugin',
  version: '1.0.0',

  adapters: [PaymentFreePrice],
};

export default PaymentFreePricePlugin;

// Re-export adapter for direct use
export { PaymentFreePrice } from './adapter.ts';
