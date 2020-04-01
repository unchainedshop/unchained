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
      total: Money!
    }

    type OrderGlobalDiscount implements OrderDiscountable {
      _id: ID!
      orderDiscount: OrderDiscount!
      order: Order!
      total: Money!
    }

    type OrderPaymentDiscount implements OrderDiscountable {
      _id: ID!
      orderDiscount: OrderDiscount!
      payment: OrderPayment!
      total: Money!
    }

    type OrderDeliveryDiscount implements OrderDiscountable {
      _id: ID!
      orderDiscount: OrderDiscount!
      delivery: OrderDelivery!
      total: Money!
    }

    type OrderItemDiscount implements OrderDiscountable {
      _id: ID!
      orderDiscount: OrderDiscount!
      item: OrderItem!
      total: Money!
    }

    type OrderDiscount {
      _id: ID!
      trigger: OrderDiscountTrigger!
      code: String
      order: Order!
      interface: DiscountInterface
      total: Money!
      discounted: [OrderDiscountable!]
    }
  `,
];
