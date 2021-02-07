import { EventEmitter } from 'events';

class OrderEvent extends EventEmitter {}

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

export const OrderEvents = new OrderEvent();
