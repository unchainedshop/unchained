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
      meta: JSON
        @deprecated(
          reason: "Due to ambiguity this field will be removed on future releases,Please write a custom resolver that reflects your business-logic"
        )
    }

    type SubscriptionDelivery {
      provider: DeliveryProvider
      meta: JSON
        @deprecated(
          reason: "Due to ambiguity this field will be removed on future releases,Please write a custom resolver that reflects your business-logic"
        )
    }

    type SubscriptionPeriod {
      start: Timestamp!
      end: Timestamp!
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
      created: DateTime!
      expires: Timestamp
      updated: DateTime
      isExpired(referenceDate: Timestamp): Boolean
      subscriptionNumber: String
      country: Country
      currency: Currency
      meta: JSON
        @deprecated(
          reason: "Due to ambiguity this field will be removed on future releases,Please write a custom resolver that reflects your business-logic"
        )
      logs(limit: Int = 10, offset: Int = 0): [Log!]!
      periods: [SubscriptionPeriod!]!
    }
  `,
];
