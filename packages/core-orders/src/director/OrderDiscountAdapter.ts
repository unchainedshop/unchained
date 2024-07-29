import { BaseDiscountAdapter } from '@unchainedshop/utils';
import { OrderDiscountConfiguration } from './OrderDiscountConfiguration.js';
import { IDiscountAdapter } from '@unchainedshop/utils';

export const OrderDiscountAdapter: Omit<
  IDiscountAdapter<OrderDiscountConfiguration>,
  'key' | 'label' | 'version'
> = BaseDiscountAdapter;
