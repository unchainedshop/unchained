import { EventEmitter } from 'events';

interface EventResult {
  payload: any;
}

export const OrderEventType = {
  CreateCart: 'CreateCart',
  AddProduct: 'AddProduct',
  AddDiscount: 'AddDiscount',
  AddQuotation: 'AddQuotation',
  Checkout: 'Checkout',
  UpdateCart: 'UpdateCart',
  EmptyCart: 'EmptyCart',
  SetPayment: 'SetPayment',
  SetDelivery: 'SetDelivery',
  Confirmed: 'Confirmed',
  FullFiled: 'FullFiled',
  UpdateDeliveryShipping: 'UpdateDeliveryShipping',
  UpdateDeliveryPickUp: 'UpdateDeliveryPickUp',
  UpdatePaymentCard: 'UpdatePaymentCard',
  UpdatePaymentInvoice: 'UpdatePaymentInvoice',
  UpdatePaymentGeneric: 'UpdatePaymentGeneric',
  SignPaymentProvider: 'SignPaymentProvider',
  OrderRemoved: 'OrderRemoved',
  DeliverOrder: 'DeliverOrder',
  PayOrder: 'PayOrder',
};

interface OrderEventTypes {
  AddProduct: (obj: EventResult) => void;
  AddDiscount: (obj: EventResult) => void;
  Checkout: (something: EventResult) => void;
  Confirmed: (obj: EventResult) => void;
  FullField: (obj: EventResult) => void;
  UpdateDeliveryShipping: (obj: EventResult) => void;
  UpdateDeliveryPickUp: (obj: EventResult) => void;
  UpdatePaymentCard: (obj: EventResult) => void;
  UpdatePaymentInvoice: (obj: EventResult) => void;
  UpdatePaymentGeneric: (obj: EventResult) => void;
  SignPaymentProvider: (obj: EventResult) => void;
  OrderRemove: (obj: EventResult) => void;
  DeliverOrder: (obj: EventResult) => void;
  PayOrder: (obj: EventResult) => void;
}

export interface OrderEvent {
  on<T extends keyof OrderEventTypes>(
    event: T,
    listener: OrderEventTypes[T]
  ): this;
  once<T extends keyof OrderEventTypes>(
    event: T,
    listener: OrderEventTypes[T]
  ): this;
  emit<T extends keyof OrderEventTypes>(
    event: T,
    ...args: Parameters<OrderEventTypes[T]>
  ): boolean;
}

export class OrderEvent extends EventEmitter {}

export const OrderEvents = new OrderEvent();
