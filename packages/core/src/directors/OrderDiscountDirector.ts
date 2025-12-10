import { BaseDiscountDirector } from './BaseDiscountDirector.ts';
import type { OrderDiscountConfiguration } from './OrderDiscountConfiguration.ts';

export const OrderDiscountDirector =
  BaseDiscountDirector<OrderDiscountConfiguration>('OrderDiscountDirector');
