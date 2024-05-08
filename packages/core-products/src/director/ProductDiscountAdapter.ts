import { IDiscountAdapter } from '@unchainedshop/types/discount.js';
import { BaseDiscountAdapter } from '@unchainedshop/utils';
import { ProductDiscountConfiguration } from './ProductDiscountConfiguration.js';

export const ProductDiscountAdapter: Omit<
  IDiscountAdapter<ProductDiscountConfiguration>,
  'key' | 'label' | 'version'
> = BaseDiscountAdapter;
