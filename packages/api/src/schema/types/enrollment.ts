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
      Manually suspended by admin
      """
      SUSPENDED

      """
      Terminated / Ended enrollment
      """
      TERMINATED
    }

    enum EnrollmentTerminationReason {
      USER_REQUESTED
      PAYMENT_FAILED
      EXPIRED
      ADMIN_ACTION
      OTHER
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
      requestedTerminationDate: DateTime
      resumeAt: DateTime
      contractStartDate: DateTime
      minimumCommitmentEnd: DateTime
      cancellationReason: EnrollmentTerminationReason
      cancellationComment: String
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
