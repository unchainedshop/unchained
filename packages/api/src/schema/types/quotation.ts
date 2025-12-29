export default [
  /* GraphQL */ `
    enum QuotationStatus {
      """
      Request for Proposal
      """
      REQUESTED

      """
      Awaiting Offer
      """
      PROCESSING

      """
      Proposal ready
      """
      PROPOSED

      """
      Quotation has been rejected by either party
      """
      REJECTED

      """
      Quotation has been used to order the product
      """
      FULFILLED
    }

    enum QuotationDocumentType {
      """
      Proposal
      """
      PROPOSAL

      """
      Other
      """
      OTHER
    }

    """
    Quotation
    """
    type Quotation {
      _id: ID!
      user: User!
      product: Product!
      status: QuotationStatus!
      created: DateTime!
      expires: DateTime
      updated: DateTime
      isExpired(referenceDate: Timestamp): Boolean
      quotationNumber: String
      fulfilled: DateTime
      rejected: DateTime
      country: Country
      currency: Currency
      configuration: [ProductConfigurationParameter!]
    }
  `,
];
