import { BaseDiscountDirector } from './BaseDiscountDirector.ts';
import type { ProductDiscountConfiguration } from './ProductDiscountConfiguration.ts';
import { ProductDiscountAdapter } from './ProductDiscountAdapter.ts';

export const ProductDiscountDirector = BaseDiscountDirector<ProductDiscountConfiguration>(
  ProductDiscountAdapter.adapterType!,
);
