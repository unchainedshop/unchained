export default [
  /* GraphQL */ `
    type DeliveryInterface @cacheControl(maxAge: 180) {
      _id: ID!
      label: String
      version: String
    }

    enum DeliveryProviderType {
      """
      Pick-Up
      """
      PICKUP

      """
      Shipping
      """
      SHIPPING
    }

    enum DeliveryProviderError {
      ADAPTER_NOT_FOUND
      NOT_IMPLEMENTED
      INCOMPLETE_CONFIGURATION
      WRONG_CREDENTIALS
    }

    type DeliveryProvider @cacheControl(maxAge: 60) {
      _id: ID!
      created: DateTime
      updated: DateTime
      deleted: DateTime
      type: DeliveryProviderType
      interface: DeliveryInterface
      configuration: JSON
      configurationError: DeliveryProviderError
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
