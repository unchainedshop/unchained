import {
  BaseDiscountAdapter,
  type IDiscountAdapter,
  type OrderDiscountConfiguration,
} from '../directors/index.ts';

export const OrderDiscountAdapter = BaseDiscountAdapter as Omit<
  IDiscountAdapter<OrderDiscountConfiguration>,
  'key' | 'label' | 'version'
>;
