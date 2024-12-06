import { BaseDiscountDirector } from '@unchainedshop/utils';
import { ProductDiscountConfiguration } from '../directors/index.js';

export const ProductDiscountDirector = BaseDiscountDirector<ProductDiscountConfiguration, any>(
  'ProductDiscountDirector',
);
