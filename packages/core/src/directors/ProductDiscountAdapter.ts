import {
  BaseDiscountAdapter,
  IDiscountAdapter,
  ProductDiscountConfiguration,
} from '../directors/index.js';

export const ProductDiscountAdapter: Omit<
  IDiscountAdapter<ProductDiscountConfiguration, any>,
  'key' | 'label' | 'version'
> = BaseDiscountAdapter;
