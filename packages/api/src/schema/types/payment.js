export default [
  /* GraphQL */ `
    type PaymentInterface {
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

    type PaymentCredentials {
      _id: ID!
      user: User!
      paymentProvider: PaymentProvider!
      token: JSON
      isValid: Boolean!
      isPreferred: Boolean!
    }

    type PaymentProvider {
      _id: ID!
      created: DateTime
      updated: DateTime
      deleted: DateTime
      type: PaymentProviderType
      interface: PaymentInterface
      configuration: JSON
      configurationError: PaymentProviderError
      isActive: Boolean
    }
  `,
];
