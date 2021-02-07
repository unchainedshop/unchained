declare module 'meteor/unchained:core-orders' {
  const Orders: any;

  interface EventResult {
    payload: any;
  }
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

  interface OrderEvent {
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
  const OrderEvents: OrderEvent;
  // eslint-disable-next-line import/prefer-default-export
  export { Orders, OrderEvents };
}
