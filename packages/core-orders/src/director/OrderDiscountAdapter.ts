import { BaseDiscountAdapter, IDiscountAdapter } from '@unchainedshop/utils';
import { OrderDiscountConfiguration } from './OrderDiscountConfiguration.js';
import { UnchainedCore } from '@unchainedshop/core';

export const OrderDiscountAdapter: Omit<
  IDiscountAdapter<OrderDiscountConfiguration, UnchainedCore>,
  'key' | 'label' | 'version'
> = BaseDiscountAdapter;
