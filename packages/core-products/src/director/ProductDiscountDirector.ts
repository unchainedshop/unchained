import { IDiscountDirector } from '@unchainedshop/types/discount';
import { BaseDiscountDirector } from '@unchainedshop/utils';

export const ProductDiscountDirector: IDiscountDirector =
  BaseDiscountDirector('ProductDiscountDirector');
