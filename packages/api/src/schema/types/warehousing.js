export default [
  /* GraphQL */ `
    type WarehousingInterface {
      _id: ID!
      label: String
      version: String
    }

    enum WarehousingProviderType {
      """
      Physical warehousing providers resemble stores or facilities that hold a quantity of stocks physically in stock.
      """
      PHYSICAL
      """
      Virtual warehousing providers resemble software that control ownership and validity of virtual products (for ex. smart contract bridges)
      """
      VIRTUAL
    }

    enum WarehousingProviderError {
      ADAPTER_NOT_FOUND
      NOT_IMPLEMENTED
      INCOMPLETE_CONFIGURATION
      WRONG_CREDENTIALS
    }

    type WarehousingProvider {
      _id: ID!
      created: DateTime
      updated: DateTime
      deleted: DateTime
      type: WarehousingProviderType
      interface: WarehousingInterface
      configuration: JSON
      configurationError: WarehousingProviderError
      isActive: Boolean
    }

    enum TokenExportStatus {
      CENTRALIZED
      EXPORTING
      DECENTRALIZED
    }

    type Token {
      _id: ID!
      product: TokenizedProduct!
      status: TokenExportStatus!
      quantity: Int!
      contractAddress: String
      chainId: String
      chainTokenId: String
    }
  `,
];
