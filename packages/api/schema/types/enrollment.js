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
      start: Timestamp!
      end: Timestamp!
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
      created: Timestamp!
      expires: Timestamp
      updated: Timestamp
      isExpired(referenceDate: Timestamp): Boolean
      enrollmentNumber: String
      country: Country
      currency: Currency
      logs(limit: Int = 10, offset: Int = 0): [Log!]!
      periods: [EnrollmentPeriod!]!
    }
  `,
];
