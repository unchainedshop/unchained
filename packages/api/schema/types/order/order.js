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

    enum OrderDocumentType {
      """
      Order Confirmation
      """
      ORDER_CONFIRMATION

      """
      Order Rejection
      """
      ORDER_REJECTION

      """
      Delivery Note
      """
      DELIVERY_NOTE

      """
      Invoice
      """
      INVOICE

      """
      Receipt
      """
      RECEIPT

      """
      Other
      """
      OTHER
    }

    """
    Just an order
    """
    type Order {
      _id: ID!
      billingAddress: Address
      confirmed: DateTime
      contact: Contact
      country: Country
      created: DateTime
      currency: Currency
      delivery: OrderDelivery
      discounts: [OrderDiscount!]
      documents(type: OrderDocumentType = CONFIRMATION): [Media!]!
      enrollment: Enrollment
      fullfilled: DateTime
      items: [OrderItem!]
      ordered: DateTime
      orderNumber: String
      payment: OrderPayment
      status: OrderStatus
      supportedDeliveryProviders: [DeliveryProvider!]!
      supportedPaymentProviders: [PaymentProvider!]!
      total(category: OrderPriceCategory): Price
      updated: DateTime
      user: User
    }
  `,
];
