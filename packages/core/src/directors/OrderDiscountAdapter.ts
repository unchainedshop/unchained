import { BaseDiscountAdapter, type IDiscountAdapter } from './BaseDiscountAdapter.ts';
import type { OrderDiscountConfiguration } from './OrderDiscountConfiguration.ts';

export const OrderDiscountAdapter: Omit<
  IDiscountAdapter<OrderDiscountConfiguration>,
  'key' | 'label' | 'version'
> = {
  ...(BaseDiscountAdapter as any),
  adapterType: Symbol.for('unchained:adapter:discount:order'),
};
