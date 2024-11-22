import { BaseDiscountDirector } from '@unchainedshop/utils';
import { OrderDiscountConfiguration } from './OrderDiscountConfiguration.js';

export const OrderDiscountDirector = BaseDiscountDirector<OrderDiscountConfiguration, any>(
  'OrderDiscountDirector',
);
