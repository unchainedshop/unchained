import { IDiscountAdapter } from '@unchainedshop/types/discount';
import { BaseDiscountAdapter } from 'meteor/unchained:utils';

export const OrderDiscountAdapter: Omit<IDiscountAdapter, 'key' | 'label' | 'version'> =
  BaseDiscountAdapter;
