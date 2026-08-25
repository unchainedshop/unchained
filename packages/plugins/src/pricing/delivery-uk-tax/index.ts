import { type IPlugin } from '@unchainedshop/core';
import { DeliveryUkTax } from './adapter.ts';

// Plugin definition
export const DeliveryUkTaxPlugin: IPlugin = {
  key: 'shop.unchained.pricing.delivery-uk-tax',
  label: 'Delivery UK Tax Plugin',
  version: '1.0.0',

  adapters: [DeliveryUkTax],
};

export default DeliveryUkTaxPlugin;

// Re-export adapter for direct use
export { DeliveryUkTax } from './adapter.ts';
