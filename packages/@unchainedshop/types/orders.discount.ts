import { TimestampFields, _ID } from './common';

export enum OrderDiscountTrigger {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
}

export type OrderDiscount = {
  _id: _ID;
  orderId: string;
  code?: string;
  trigger: OrderDiscountTrigger;
  discountKey: string;
  reservation?: any;
  context?: any;
} & TimestampFields;
