import { type IPlugin } from '@unchainedshop/core';
import { ProductUkTax } from './adapter.ts';

// Plugin definition
export const ProductUkTaxPlugin: IPlugin = {
  key: 'shop.unchained.pricing.product-uk-tax',
  label: 'Product UK Tax Plugin',
  version: '1.0.0',

  adapters: [ProductUkTax],
};

export default ProductUkTaxPlugin;

// Re-export adapter for direct use
export { ProductUkTax } from './adapter.ts';
