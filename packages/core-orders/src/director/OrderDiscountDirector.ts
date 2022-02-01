import { IDiscountDirector } from '@unchainedshop/types/discount';
import { BaseDiscountDirector } from 'meteor/unchained:utils';

export const OrderDiscountDirector: IDiscountDirector = BaseDiscountDirector('OrderDiscountDirector');
