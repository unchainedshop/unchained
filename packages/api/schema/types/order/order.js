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
      user: User
      status: OrderStatus
      created: DateTime
      updated: DateTime
      ordered: DateTime
      orderNumber: String
      confirmed: DateTime
      fullfilled: DateTime
      contact: Contact
      country: Country
      currency: Currency
      billingAddress: Address
      delivery: OrderDelivery
      payment: OrderPayment
      items: [OrderItem!]
      discounts: [OrderDiscount!]
      total(category: OrderPriceCategory): Price
      documents(type: OrderDocumentType = CONFIRMATION): [Media!]!
      supportedDeliveryProviders: [DeliveryProvider!]!
      supportedPaymentProviders: [PaymentProvider!]!
      enrollment: Enrollment
      logs(limit: Int = 10, offset: Int = 0): [Log!]!
    }
  `,
];
