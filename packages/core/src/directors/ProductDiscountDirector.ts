import { BaseDiscountDirector, type ProductDiscountConfiguration } from '../directors/index.ts';

export const ProductDiscountDirector =
  BaseDiscountDirector<ProductDiscountConfiguration>('ProductDiscountDirector');
