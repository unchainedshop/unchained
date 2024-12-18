import { BaseDiscountDirector, ProductDiscountConfiguration } from '../directors/index.js';

export const ProductDiscountDirector =
  BaseDiscountDirector<ProductDiscountConfiguration>('ProductDiscountDirector');
