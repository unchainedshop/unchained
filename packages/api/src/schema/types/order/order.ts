export default [
  /* GraphQL */ `
    enum OrderStatus {
      """
      Open Order / Cart
      """
      OPEN

      """
      Order has been sent but confirmation awaiting
      """
      PENDING

      """
      Order has been rejected
      """
      REJECTED

      """
      Order has been confirmed
      """
      CONFIRMED

      """
      Order has been fulfilled completely (all positions in delivery)
      """
      FULLFILLED
    }

    enum OrderPriceCategory {
      """
      Product Price Total
      """
      ITEMS

      """
      Payment Fees
      """
      PAYMENT

      """
      Delivery Fees
      """
      DELIVERY

      """
      Tax
      """
      TAXES

      """
      Discount
      """
      DISCOUNTS
    }

    """
    Just an order
    """
    type Order {
      _id: ID!
      billingAddress: Address
      confirmed: DateTime
      rejected: DateTime
      contact: Contact
      country: Country
      created: DateTime
      currency: Currency
      delivery: OrderDelivery
      discounts: [OrderDiscount!]
      enrollment: Enrollment
      fullfilled: DateTime
      items: [OrderItem!]
      ordered: DateTime
      orderNumber: String
      payment: OrderPayment
      status: OrderStatus
      supportedDeliveryProviders: [DeliveryProvider!]!
      supportedPaymentProviders: [PaymentProvider!]!
      total(category: OrderPriceCategory, useNetPrice: Boolean = false): Price
      updated: DateTime
      user: User
    }
    type OrderStatisticsRecord {
      date: Date!
      total: Price!
    }

    type OrderStatistics {
      newCount: Int!
      checkoutCount: Int!
      rejectCount: Int!
      confirmCount: Int!
      fulfillCount: Int!
      confirmRecords(dateRange: DateFilterInput): [OrderStatisticsRecord!]!
      checkoutRecords(dateRange: DateFilterInput): [OrderStatisticsRecord!]!
      rejectRecords(dateRange: DateFilterInput): [OrderStatisticsRecord!]!
      newRecords(dateRange: DateFilterInput): [OrderStatisticsRecord!]!
    }
  `,
];
