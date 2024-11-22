import { BaseDiscountAdapter, IDiscountAdapter } from '@unchainedshop/utils';
import { ProductDiscountConfiguration } from './ProductDiscountConfiguration.js';
import { UnchainedCore } from '@unchainedshop/core';

export const ProductDiscountAdapter: Omit<
  IDiscountAdapter<ProductDiscountConfiguration, UnchainedCore>,
  'key' | 'label' | 'version'
> = BaseDiscountAdapter;
