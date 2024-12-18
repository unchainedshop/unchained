import {
  BaseDiscountAdapter,
  IDiscountAdapter,
  OrderDiscountConfiguration,
} from '../directors/index.js';

export const OrderDiscountAdapter: Omit<
  IDiscountAdapter<OrderDiscountConfiguration>,
  'key' | 'label' | 'version'
> = BaseDiscountAdapter;
