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
      Terminated / Ended enrollment
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
      start: DateTime!
      end: DateTime!
      isTrial: Boolean!
      order: Order
    }

    """
    Enrollment
    """
    type Enrollment {
      _id: ID!
      billingAddress: Address
      contact: Contact
      country: Country
      created: DateTime!
      currency: Currency
      delivery: EnrollmentDelivery
      enrollmentNumber: String
      expires: DateTime
      isExpired(referenceDate: Timestamp): Boolean
      payment: EnrollmentPayment
      periods: [EnrollmentPeriod!]!
      plan: EnrollmentPlan!
      status: EnrollmentStatus!
      updated: DateTime
      user: User!
    }
  `,
];
