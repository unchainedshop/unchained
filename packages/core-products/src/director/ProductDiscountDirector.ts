import { BaseDiscountDirector } from '@unchainedshop/utils';
import { ProductDiscountConfiguration } from './ProductDiscountConfiguration.js';

export const ProductDiscountDirector =
  BaseDiscountDirector<ProductDiscountConfiguration>('ProductDiscountDirector');
