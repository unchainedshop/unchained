import { BaseDiscountAdapter, IDiscountAdapter } from '@unchainedshop/utils';
import { ProductDiscountConfiguration } from '../directors/index.js';

export const ProductDiscountAdapter: Omit<
  IDiscountAdapter<ProductDiscountConfiguration, any>,
  'key' | 'label' | 'version'
> = BaseDiscountAdapter;
