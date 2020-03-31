export default [
  /* GraphQL */ `
    enum OrderPaymentStatus {
      """
      Unpaid Order
      """
      OPEN

      """
      Order has been paied
      """
      PAID

      """
      Order has been refunded
      """
      REFUNDED
    }

    interface OrderPayment {
      _id: ID!
      provider: PaymentProvider
      status: OrderPaymentStatus
      fee: Money
      paid: Date
      meta: JSON
      discounts: [OrderPaymentDiscount!]
    }

    type OrderPaymentInvoice implements OrderPayment {
      _id: ID!
      provider: PaymentProvider
      status: OrderPaymentStatus
      fee: Money
      paid: Date
      meta: JSON
      discounts: [OrderPaymentDiscount!]
    }

    type OrderPaymentCard implements OrderPayment {
      _id: ID!
      provider: PaymentProvider
      status: OrderPaymentStatus
      paid: Date
      fee: Money
      meta: JSON
      discounts: [OrderPaymentDiscount!]
    }

    type OrderPaymentGeneric implements OrderPayment {
      _id: ID!
      provider: PaymentProvider
      status: OrderPaymentStatus
      fee: Money
      paid: Date
      meta: JSON
      discounts: [OrderPaymentDiscount!]

      """
      Sign a transaction with the provider
      """
      sign(transactionContext: JSON): String
    }
  `
];
