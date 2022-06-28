import { IDiscountAdapter } from '@unchainedshop/types/discount';
import { BaseDiscountAdapter } from '@unchainedshop/utils';

export const ProductDiscountAdapter: Omit<IDiscountAdapter, 'key' | 'label' | 'version'> =
  BaseDiscountAdapter;
