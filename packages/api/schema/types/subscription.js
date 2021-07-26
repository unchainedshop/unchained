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
      PAUSED

      """
      Terminated / Ended subscription
      """
      TERMINATED
    }

    type SubscriptionPlan {
      product: PlanProduct!
      quantity: Int!
      configuration: [ProductConfigurationParameter!]
    }

    type SubscriptionPayment {
      provider: PaymentProvider
    }

    type SubscriptionDelivery {
      provider: DeliveryProvider
    }

    type SubscriptionPeriod {
      start: Date!
      end: Date!
      isTrial: Boolean!
      order: Order
    }

    """
    Subscription
    """
    type Subscription {
      _id: ID!
      user: User!
      plan: SubscriptionPlan!
      payment: SubscriptionPayment
      delivery: SubscriptionDelivery
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
      logs(limit: Int = 10, offset: Int = 0): [Log!]!
      periods: [SubscriptionPeriod!]!
    }
  `,
];
