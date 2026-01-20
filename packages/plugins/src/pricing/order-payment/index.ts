import { type IPlugin } from '@unchainedshop/core';
import { OrderPayment } from './adapter.ts';

// Plugin definition
export const OrderPaymentPlugin: IPlugin = {
  key: 'shop.unchained.pricing.order-payment',
  label: 'Order Payment Pricing Plugin',
  version: '1.0.0',

  adapters: [OrderPayment],
};

export default OrderPaymentPlugin;

// Re-export adapter for direct use
export { OrderPayment } from './adapter.ts';
