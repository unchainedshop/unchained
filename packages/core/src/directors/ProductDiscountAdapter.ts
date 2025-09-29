import {
  BaseDiscountAdapter,
  IDiscountAdapter,
  ProductDiscountConfiguration,
} from '../directors/index.js';

export const ProductDiscountAdapter = BaseDiscountAdapter as Omit<
  IDiscountAdapter<ProductDiscountConfiguration>,
  'key' | 'label' | 'version'
>;
