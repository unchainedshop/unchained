import { IDiscountDirector } from '@unchainedshop/types/discount.js';
import { BaseDiscountDirector } from '@unchainedshop/utils';

export const ProductDiscountDirector: IDiscountDirector =
  BaseDiscountDirector('ProductDiscountDirector');
