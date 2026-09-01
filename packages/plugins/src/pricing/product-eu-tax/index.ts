import { type IPlugin } from '@unchainedshop/core';
import { ProductEuTax } from './adapter.ts';

// Plugin definition
export const ProductEuTaxPlugin: IPlugin = {
  key: 'shop.unchained.pricing.product-eu-tax',
  label: 'Product EU Tax Plugin',
  version: '1.0.0',

  adapters: [ProductEuTax],
};

export default ProductEuTaxPlugin;

// Re-export adapter for direct use
export { ProductEuTax } from './adapter.ts';
