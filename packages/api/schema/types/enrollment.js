export default [
  /* GraphQL */ `
    enum EnrollmentStatus {
      """
      Initial
      """
      INITIAL

      """
      Active Enrollment
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

    type EnrollmentPlan {
      product: PlanProduct!
      quantity: Int!
      configuration: [ProductConfigurationParameter!]
    }

    type EnrollmentPayment {
      provider: PaymentProvider
    }

    type EnrollmentDelivery {
      provider: DeliveryProvider
    }

    type EnrollmentPeriod {
      start: Date!
      end: Date!
      isTrial: Boolean!
      order: Order
    }

    """
    Enrollment
    """
    type Enrollment {
      _id: ID!
      user: User!
      plan: EnrollmentPlan!
      payment: EnrollmentPayment
      delivery: EnrollmentDelivery
      billingAddress: Address
      contact: Contact
      status: EnrollmentStatus!
      created: Date!
      expires: Date
      updated: Date
      isExpired(referenceDate: Date): Boolean
      subscriptionNumber: String
      country: Country
      currency: Currency
      logs(limit: Int = 10, offset: Int = 0): [Log!]!
      periods: [EnrollmentPeriod!]!
    }
  `,
];
