import { type IPlugin } from '@unchainedshop/core';
import { DeliveryEuTax } from './adapter.ts';

// Plugin definition
export const DeliveryEuTaxPlugin: IPlugin = {
  key: 'shop.unchained.pricing.delivery-eu-tax',
  label: 'Delivery EU Tax Plugin',
  version: '1.0.0',

  adapters: [DeliveryEuTax],
};

export default DeliveryEuTaxPlugin;

// Re-export adapter for direct use
export { DeliveryEuTax } from './adapter.ts';
