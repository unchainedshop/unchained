import {
  BaseDiscountAdapter,
  IDiscountAdapter,
  OrderDiscountConfiguration,
} from '../directors/index.js';

export const OrderDiscountAdapter = BaseDiscountAdapter as Omit<
  IDiscountAdapter<OrderDiscountConfiguration>,
  'key' | 'label' | 'version'
>;
