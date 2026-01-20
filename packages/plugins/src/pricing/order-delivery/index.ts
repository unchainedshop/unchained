import { type IPlugin } from '@unchainedshop/core';
import { OrderDelivery } from './adapter.ts';

// Plugin definition
export const OrderDeliveryPlugin: IPlugin = {
  key: 'shop.unchained.pricing.order-delivery',
  label: 'Order Delivery Pricing Plugin',
  version: '1.0.0',

  adapters: [OrderDelivery],
};

export default OrderDeliveryPlugin;

// Re-export adapter for direct use
export { OrderDelivery } from './adapter.ts';
