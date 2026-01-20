import { type IPlugin } from '@unchainedshop/core';
import { ProductDiscount } from './adapter.ts';

// Plugin definition
export const ProductDiscountPlugin: IPlugin = {
  key: 'shop.unchained.pricing.product-discount',
  label: 'Product Discount Pricing Plugin',
  version: '1.0.0',

  adapters: [ProductDiscount],
};

export default ProductDiscountPlugin;

// Re-export adapter for direct use
export { ProductDiscount } from './adapter.ts';
