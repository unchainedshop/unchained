import { type IPlugin } from '@unchainedshop/core';
import { DeliveryUsSalesTax } from './adapter.ts';

// Plugin definition
export const DeliveryUsSalesTaxPlugin: IPlugin = {
  key: 'shop.unchained.pricing.delivery-us-sales-tax',
  label: 'Delivery US Sales Tax Plugin',
  version: '1.0.0',

  adapters: [DeliveryUsSalesTax],
};

export default DeliveryUsSalesTaxPlugin;

// Re-export adapter for direct use
export { DeliveryUsSalesTax } from './adapter.ts';
