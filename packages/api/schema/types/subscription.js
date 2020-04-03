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

    """
    Subscription
    """
    type Subscription {
      _id: ID!
      user: User!
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
