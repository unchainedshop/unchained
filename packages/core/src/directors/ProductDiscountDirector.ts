import { BaseDiscountDirector } from '@unchainedshop/utils';
import { ProductDiscountConfiguration } from '@unchainedshop/core-products';

export const ProductDiscountDirector = BaseDiscountDirector<ProductDiscountConfiguration, any>(
  'ProductDiscountDirector',
);
