export default [
  /* GraphQL */ `
    type PaymentInterface @cacheControl(maxAge: 180) {
      _id: ID!
      label: String
      version: String
    }

    enum PaymentProviderType {
      """
      Card
      """
      CARD

      """
      Invoice
      """
      INVOICE

      """
      Generic
      """
      GENERIC
    }

    enum PaymentProviderError {
      ADAPTER_NOT_FOUND
      NOT_IMPLEMENTED
      INCOMPLETE_CONFIGURATION
      WRONG_CREDENTIALS
    }

    type PaymentCredentials @cacheControl(maxAge: 0, scope: PRIVATE) {
      _id: ID!
      user: User!
      paymentProvider: PaymentProvider!
      token: JSON
      meta: JSON
      isValid: Boolean!
      isPreferred: Boolean!
    }

    type PaymentProvider @cacheControl(maxAge: 60) {
      _id: ID!
      created: DateTime
      updated: DateTime
      deleted: DateTime
      type: PaymentProviderType
      interface: PaymentInterface
      configuration: JSON
      configurationError: PaymentProviderError
      isActive: Boolean
      simulatedPrice(
        currencyCode: String
        useNetPrice: Boolean = false
        orderId: ID
        context: JSON
      ): Price @cacheControl(scope: PRIVATE, maxAge: 10)
    }
  `,
];
