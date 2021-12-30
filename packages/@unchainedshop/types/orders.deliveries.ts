import { LogFields, ModuleMutations, TimestampFields, Update, _ID } from './common';

export enum OrderDeliveryStatus {
  OPEN = 'OPEN', // Null value is mapped to OPEN status
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
}

export type OrderDelivery = {
  _id: _ID;
  orderId: string;
  deliveryProviderId: string;
  delivered?: Date;
  status: OrderDeliveryStatus | null;
  context?: any;
  calculation: Array<any>;
} & LogFields &
  TimestampFields;


export type OrderDeliveriesModule = ModuleMutations<OrderDelivery> & {
  // Queries
  findDelivery: (params: {
    orderDeliveryId: string;
  }) => Promise<OrderDelivery>;
    
  // Transformations
  normalizedStatus: (orderDelivery: OrderDelivery) => string
  isBlockingOrderFullfillment: (orderDelivery: OrderDelivery) => boolean
  
  // Mutations
  create: (doc: OrderDelivery, userId?: string) => Promise<OrderDelivery>
  markAsDelivered: (orderDelivery: OrderDelivery) => Promise<void>

  update: (_id: _ID, doc: Update<OrderDelivery>, userId?: string) => Promise<OrderDelivery>

  updateDelivery: (_id: _ID, params: { context: any, orderId: string }, userId?: string) => Promise<OrderDelivery>
  updateStatus: (_id: _ID, params: { status: OrderDeliveryStatus, info?: string }, userId?: string) => Promise<OrderDelivery>

  updateCalculation: (_id: _ID) => Promise<boolean>
};