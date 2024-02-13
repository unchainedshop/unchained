export default [
  /* GraphQL */ `
    enum OrderDiscountTrigger {
      """
      System triggered
      """
      SYSTEM

      """
      User triggered
      """
      USER
    }

    interface OrderDiscountable {
      _id: ID!
      orderDiscount: OrderDiscount!
      total: Price!
    }

    type OrderGlobalDiscount implements OrderDiscountable {
      _id: ID!
      orderDiscount: OrderDiscount!
      order: Order!
      total: Price!
    }

    type OrderPaymentDiscount implements OrderDiscountable {
      _id: ID!
      orderDiscount: OrderDiscount!
      payment: OrderPayment!
      total: Price!
    }

    type OrderDeliveryDiscount implements OrderDiscountable {
      _id: ID!
      orderDiscount: OrderDiscount!
      delivery: OrderDelivery!
      total: Price!
    }

    type OrderItemDiscount implements OrderDiscountable {
      _id: ID!
      orderDiscount: OrderDiscount!
      item: OrderItem!
      total: Price!
    }

    type OrderDiscount {
      _id: ID!
      trigger: OrderDiscountTrigger!
      code: String
      order: Order!
      interface: DiscountInterface
      total(useNetPrice: Boolean = false): Price!
      discounted: [OrderDiscountable!]
    }
  `,
];
