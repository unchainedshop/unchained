import { BaseDiscountDirector } from './BaseDiscountDirector.js';
import { OrderDiscountConfiguration } from './OrderDiscountConfiguration.js';

export const OrderDiscountDirector = BaseDiscountDirector<OrderDiscountConfiguration, any>(
  'OrderDiscountDirector',
);
