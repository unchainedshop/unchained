import { ModuleMutations, TimestampFields, _ID } from './common';
import { Order } from './orders';

export enum OrderDiscountTrigger {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
}

export type OrderDiscount = {
  _id?: _ID;
  orderId: string;
  code?: string;
  trigger?: OrderDiscountTrigger;
  discountKey?: string;
  reservation?: any;
  context?: any;
} & TimestampFields;

export type OrderDiscountModule = Omit<
  ModuleMutations<OrderDiscount>,
  'create'
> & {
  // Queries
  findOrderDiscount: (params: {
    discountId: string;
  }) => Promise<OrderDiscount>;

  // Mutations
  create: (
    doc: { orderId: string; code: string },
    userId?: string
  ) => Promise<Order>;

  updateCalculation: (_id: _ID) => Promise<boolean>;
};
