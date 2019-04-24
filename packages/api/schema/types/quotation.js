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
      FULLFILLED
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
      created: Date!
      expires: Date
      updated: Date
      isExpired(referenceDate: Date): Boolean
      quotationNumber: String
      fullfilled: Date
      rejected: Date
      country: Country
      currency: Currency
      meta: JSON
      configuration: [ProductConfigurationParameter!]
      documents(type: QuotationDocumentType = PROPOSAL): [Media!]!
      logs(limit: Int = 10, offset: Int = 0): [Log!]!
    }
  `
];
