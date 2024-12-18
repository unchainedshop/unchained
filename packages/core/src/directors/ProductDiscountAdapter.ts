import {
  BaseDiscountAdapter,
  IDiscountAdapter,
  ProductDiscountConfiguration,
} from '../directors/index.js';

export const ProductDiscountAdapter: Omit<
  IDiscountAdapter<ProductDiscountConfiguration>,
  'key' | 'label' | 'version'
> = BaseDiscountAdapter;
