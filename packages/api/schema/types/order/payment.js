export default [/* GraphQL */`
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

}

type OrderPaymentInvoice implements OrderPayment {
  _id: ID!
  provider: PaymentProvider
  status: OrderPaymentStatus
  fee: Money
  paid: Date
  meta: JSON

}

type OrderPaymentCrypto implements OrderPayment {
  _id: ID!
  provider: PaymentProvider
  status: OrderPaymentStatus
  fee: Money
  paid: Date
  meta: JSON


  """
  A crypto currency payment works via pre-payment like credit cards,
  so every order payment get's it's own public key
  """
  walletAddress: String
  walletBalance: Money
}

type OrderPaymentCard implements OrderPayment {
  _id: ID!
  provider: PaymentProvider
  status: OrderPaymentStatus
  paid: Date
  fee: Money
  meta: JSON

}

type OrderPaymentPaypal implements OrderPayment {
  _id: ID!
  provider: PaymentProvider
  status: OrderPaymentStatus
  fee: Money
  paid: Date
  meta: JSON


  """
  Get the clientToken for Paypal Payments with the Braintree SDK
  """
  clientToken: String!
}

type OrderPaymentPostfinance implements OrderPayment {
  _id: ID!
  provider: PaymentProvider
  status: OrderPaymentStatus
  fee: Money
  paid: Date
  meta: JSON
}
`];
