import { type IPlugin } from '@unchainedshop/core';
import { OrderDiscount } from './adapter.ts';

// Plugin definition
export const OrderDiscountPlugin: IPlugin = {
  key: 'shop.unchained.pricing.order-discount',
  label: 'Order Discount Pricing Plugin',
  version: '1.0.0',

  adapters: [OrderDiscount],
};

export default OrderDiscountPlugin;

// Re-export adapter for direct use
export { OrderDiscount } from './adapter.ts';
