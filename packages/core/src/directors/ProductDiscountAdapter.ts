import { BaseDiscountAdapter, IDiscountAdapter } from '@unchainedshop/utils';
import { ProductDiscountConfiguration } from '@unchainedshop/core-products';

export const ProductDiscountAdapter: Omit<
  IDiscountAdapter<ProductDiscountConfiguration, any>,
  'key' | 'label' | 'version'
> = BaseDiscountAdapter;
