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
      meta: JSON
        @deprecated(
          reason: "Due to ambiguity this field will be removed on future releases,Please write a custom resolver that reflects your business-logic"
        )
    }

    type EnrollmentDelivery {
      provider: DeliveryProvider
      meta: JSON
        @deprecated(
          reason: "Due to ambiguity this field will be removed on future releases,Please write a custom resolver that reflects your business-logic"
        )
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
      meta: JSON
        @deprecated(
          reason: "Due to ambiguity this field will be removed on future releases,Please write a custom resolver that reflects your business-logic"
        )
      logs(limit: Int = 10, offset: Int = 0): [Log!]!
      periods: [EnrollmentPeriod!]!
    }
  `,
];
