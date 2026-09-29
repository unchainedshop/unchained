export default [
  /* GraphQL */ `
    """
    The optional fields follow partial update rules: omit a field to keep the stored value,
    pass null to clear it, pass a value to replace it.
    """
    input UpdateProductTokenizationInput {
      "Omit for off-chain tokens (e.g. tickets)"
      contractAddress: String
      contractStandard: SmartContractStandard!
      "Omit for off-chain tokens (e.g. tickets); required by on-chain ERC1155 minters"
      tokenId: String
      supply: Int!
      """
      Omit to keep the stored properties (e.g. a ticket event's slot), pass null to clear them;
      an object replaces them entirely (no deep merge)
      """
      ercMetadataProperties: JSON
    }

    enum SmartContractStandard {
      ERC1155
      ERC721
    }

    type ContractConfiguration @cacheControl(maxAge: 180) {
      tokenId: String
      supply: Int!
      ercMetadataProperties: JSON
    }

    """
    Tokenized Product (Blockchain materialized Product)
    """
    type TokenizedProduct implements Product @cacheControl(maxAge: 180) {
      _id: ID!
      sequence: Int!
      status: ProductStatus!
      tags: [LowerCaseString!]
      created: DateTime
      updated: DateTime
      published: DateTime
      media(limit: Int = 10, offset: Int = 0, tags: [LowerCaseString!]): [ProductMedia!]!
      texts(forceLocale: Locale): ProductTexts
      catalogPrice(quantity: Int = 1, currencyCode: String): Price
      leveledCatalogPrices(currencyCode: String): [PriceLevel!]!
      simulatedPrice(
        currencyCode: String
        useNetPrice: Boolean = false
        quantity: Int = 1
        configuration: [ProductConfigurationParameterInput!]
      ): Price @cacheControl(scope: PRIVATE, maxAge: 10)
      simulatedStocks(referenceDate: Timestamp): [Stock!] @cacheControl(scope: PRIVATE, maxAge: 10)
      assortmentPaths(forceLocale: Locale): [ProductAssortmentPath!]!
      proxies: [ConfigurableOrBundleProduct!]!
      siblings(
        assortmentId: ID
        limit: Int = 10
        offset: Int = 0
        includeInactive: Boolean = false
      ): [Product!]!
      reviews(
        limit: Int = 10
        offset: Int = 0
        sort: [SortOptionInput!]
        queryString: String
      ): [ProductReview!]!
      reviewsCount(queryString: String): Int!
      contractAddress: String
      contractStandard: SmartContractStandard
      contractConfiguration: ContractConfiguration
      tokens: [Token!]!
      tokensCount: Int!
    }
  `,
];
