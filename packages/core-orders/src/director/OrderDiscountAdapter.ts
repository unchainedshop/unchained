import { IDiscountAdapter } from '@unchainedshop/types/discount';
import { BaseDiscountAdapter } from '@unchainedshop/utils';

export const OrderDiscountAdapter: Omit<IDiscountAdapter, 'key' | 'label' | 'version'> =
  BaseDiscountAdapter;
