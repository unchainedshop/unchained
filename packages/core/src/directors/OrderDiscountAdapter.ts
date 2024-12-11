import {
  BaseDiscountAdapter,
  IDiscountAdapter,
  OrderDiscountConfiguration,
} from '../directors/index.js';

export const OrderDiscountAdapter: Omit<
  IDiscountAdapter<OrderDiscountConfiguration, any>,
  'key' | 'label' | 'version'
> = BaseDiscountAdapter;
