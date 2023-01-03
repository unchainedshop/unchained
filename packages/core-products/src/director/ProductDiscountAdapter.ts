import { IDiscountAdapter } from '@unchainedshop/types/discount.js';
import { BaseDiscountAdapter } from '@unchainedshop/utils';

export const ProductDiscountAdapter: Omit<IDiscountAdapter, 'key' | 'label' | 'version'> =
  BaseDiscountAdapter;
