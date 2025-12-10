import {
  BaseDiscountAdapter,
  type IDiscountAdapter,
  type ProductDiscountConfiguration,
} from '../directors/index.ts';

export const ProductDiscountAdapter = BaseDiscountAdapter as Omit<
  IDiscountAdapter<ProductDiscountConfiguration>,
  'key' | 'label' | 'version'
>;
