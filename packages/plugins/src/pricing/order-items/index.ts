import { type IPlugin } from '@unchainedshop/core';
import { OrderItems } from './adapter.ts';

// Plugin definition
export const OrderItemsPlugin: IPlugin = {
  key: 'shop.unchained.pricing.order-items',
  label: 'Order Items Pricing Plugin',
  version: '1.0.0',

  adapters: [OrderItems],
};

export default OrderItemsPlugin;

// Re-export adapter for direct use
export { OrderItems } from './adapter.ts';
