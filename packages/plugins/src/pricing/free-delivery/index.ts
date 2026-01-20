import { type IPlugin } from '@unchainedshop/core';
import { DeliveryFreePrice } from './adapter.ts';

// Plugin definition
export const DeliveryFreePricePlugin: IPlugin = {
  key: 'shop.unchained.pricing.delivery-free',
  label: 'Free Delivery Pricing Plugin',
  version: '1.0.0',

  adapters: [DeliveryFreePrice],
};

export default DeliveryFreePricePlugin;

// Re-export adapter for direct use
export { DeliveryFreePrice } from './adapter.ts';
