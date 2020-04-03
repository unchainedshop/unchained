export default [
  /* GraphQL */ `
    enum SubscriptionStatus {
      """
      Initial
      """
      INITIAL

      """
      Active Subscription
      """
      ACTIVE

      """
      Paused because of overdue payments
      """
      PROPOSED

      """
      Terminated / Ended subscription
      """
      TERMINATED
    }

    type SubscriptionPlan {
      _id: ID!
      product: Product!
      quantity: Int!
      configuration: [ProductConfigurationParameter!]
    }

    type SubscriptionPayment {
      _id: ID!
      provider: PaymentProvider
      meta: JSON
    }

    type SubscriptionDelivery {
      _id: ID!
      provider: DeliveryProvider
      meta: JSON
    }

    """
    Subscription
    """
    type Subscription {
      _id: ID!
      user: User!
      plans: [SubscriptionPlan!]!
      payment: SubscriptionPayment!
      delivery: SubscriptionDelivery!
      billingAddress: Address
      contact: Contact
      status: SubscriptionStatus!
      created: Date!
      expires: Date
      updated: Date
      isExpired(referenceDate: Date): Boolean
      subscriptionNumber: String
      country: Country
      currency: Currency
      meta: JSON
      logs(limit: Int = 10, offset: Int = 0): [Log!]!
    }
  `,
];
