export default [
  /* GraphQL */ `
    type WarehousingInterface {
      _id: ID!
      label: String
      version: String
    }

    enum WarehousingProviderType {
      """
      Physical
      """
      PHYSICAL
    }

    enum WarehousingProviderError {
      ADAPTER_NOT_FOUND
      NOT_IMPLEMENTED
      INCOMPLETE_CONFIGURATION
      WRONG_CREDENTIALS
    }

    type WarehousingProvider {
      _id: ID!
      created: Date
      updated: Date
      deleted: Date
      type: WarehousingProviderType
      interface: WarehousingInterface
      configuration: JSON
      configurationError: WarehousingProviderError
      isActive: Boolean
    }
  `
];
