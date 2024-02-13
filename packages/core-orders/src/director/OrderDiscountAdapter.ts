import { IDiscountAdapter } from '@unchainedshop/types/discount.js';
import { BaseDiscountAdapter } from '@unchainedshop/utils';
import { OrderDiscountConfiguration } from './OrderDiscountConfiguration.js';

export const OrderDiscountAdapter: Omit<
  IDiscountAdapter<OrderDiscountConfiguration>,
  'key' | 'label' | 'version'
> = BaseDiscountAdapter;
