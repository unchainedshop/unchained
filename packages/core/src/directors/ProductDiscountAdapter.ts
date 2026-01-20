import { BaseDiscountAdapter, type IDiscountAdapter } from './BaseDiscountAdapter.ts';
import type { ProductDiscountConfiguration } from './ProductDiscountConfiguration.ts';

export const ProductDiscountAdapter: Omit<
  IDiscountAdapter<ProductDiscountConfiguration>,
  'key' | 'label' | 'version'
> = {
  ...(BaseDiscountAdapter as any),
  adapterType: Symbol.for('unchained:adapter:discount:product'),
};
