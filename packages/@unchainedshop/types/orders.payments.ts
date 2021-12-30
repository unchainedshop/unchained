import { LogFields, ModuleMutations, TimestampFields, _ID } from './common';

export enum OrderPaymentStatus {
  OPEN = 'OPEN', // Null value is mapped to OPEN status
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

export type OrderPayment = {
  _id: _ID;
  orderId: string;
  context?: any;
  paid?: Date;
  paymentProviderId?: string;
  status?: OrderPaymentStatus | null;
  calculation?: Array<any>;
} & LogFields &
  TimestampFields;

export type OrderPaymentsModule = ModuleMutations<OrderPayment> & {
  // Queries
  findOrderPayment: (params: { orderPaymentId: string }) => Promise<OrderPayment>;

  // Mutations
  markAsPaid: (payment: OrderPayment, meta: any, userId?: string) => Promise<void>

  updateContext: (orderPaymentId: string, context: any, userId?: string) => Promise<OrderPayment>
  
  updateCalculation: (_id: _ID) => Promise<boolean>;
};
