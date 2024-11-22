import { BaseDiscountAdapter, IDiscountAdapter } from '@unchainedshop/utils';
import { ProductDiscountConfiguration } from './ProductDiscountConfiguration.js';

export const ProductDiscountAdapter: Omit<
  IDiscountAdapter<ProductDiscountConfiguration, any>,
  'key' | 'label' | 'version'
> = BaseDiscountAdapter;
