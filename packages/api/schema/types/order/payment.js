export default [
  /* GraphQL */ `
    enum OrderPaymentStatus {
      """
      Unpaid Order
      """
      OPEN

      """
      Order has been paid
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
      fee: Price
      paid: DateTime
      discounts: [OrderPaymentDiscount!]
    }

    type OrderPaymentInvoice implements OrderPayment {
      _id: ID!
      provider: PaymentProvider
      status: OrderPaymentStatus
      fee: Price
      paid: DateTime
      discounts: [OrderPaymentDiscount!]
    }

    type OrderPaymentCard implements OrderPayment {
      _id: ID!
      provider: PaymentProvider
      status: OrderPaymentStatus
      paid: DateTime
      fee: Price
      discounts: [OrderPaymentDiscount!]
    }

    type OrderPaymentGeneric implements OrderPayment {
      _id: ID!
      provider: PaymentProvider
      status: OrderPaymentStatus
      fee: Price
      paid: DateTime
      discounts: [OrderPaymentDiscount!]

      """
      Sign a transaction with the provider
      """
      sign(transactionContext: JSON): String
        @deprecated(
          reason: "Please use mutation.signPaymentProviderForCheckout instead"
        )
    }
  `,
];
