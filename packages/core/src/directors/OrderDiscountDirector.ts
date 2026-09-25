import { BaseDiscountDirector } from './BaseDiscountDirector.ts';
import type { OrderDiscountConfiguration } from './OrderDiscountConfiguration.ts';
import { OrderDiscountAdapter } from './OrderDiscountAdapter.ts';

export const OrderDiscountDirector = BaseDiscountDirector<OrderDiscountConfiguration>(
  OrderDiscountAdapter.adapterType!,
);
