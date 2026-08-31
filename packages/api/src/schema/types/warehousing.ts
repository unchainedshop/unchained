export default [
  /* GraphQL */ `
    type WarehousingInterface @cacheControl(maxAge: 180) {
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

    type WarehousingProvider @cacheControl(maxAge: 60) {
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

    type Token @cacheControl(maxAge: 0, scope: PRIVATE) {
      _id: ID!
      product: TokenizedProduct!
      status: TokenExportStatus!
      quantity: Int!
      isInvalidateable: Boolean!
      """
      Get an access key that you can pass along the HTTP Header "x-token-accesskey" to access the token anonymously.
      """
      accessKey: String!
      invalidatedDate: DateTime
      user: User
      expiryDate: DateTime
      contractAddress: String
      walletAddress: String
      chainId: String
      tokenSerialNumber: String
      ercMetadata(forceLocale: Locale): JSON
    }
  `,
];
