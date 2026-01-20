import { type IPlugin } from '@unchainedshop/core';
import { DeliverySwissTax } from './adapter.ts';

// Plugin definition
export const DeliverySwissTaxPlugin: IPlugin = {
  key: 'shop.unchained.pricing.delivery-swiss-tax',
  label: 'Delivery Swiss Tax Plugin',
  version: '1.0.0',

  adapters: [DeliverySwissTax],
};

export default DeliverySwissTaxPlugin;

// Re-export adapter for direct use
export { DeliverySwissTax } from './adapter.ts';
