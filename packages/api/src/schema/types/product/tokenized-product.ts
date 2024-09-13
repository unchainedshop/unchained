export default [
  /* GraphQL */ `
    input UpdateProductTokenizationInput {
      contractAddress: String!
      contractStandard: SmartContractStandard!
      tokenId: String!
      supply: Int!
      ercMetadataProperties: JSON
    }

    enum SmartContractStandard {
      ERC1155
      ERC721
    }

    type ContractConfiguration @cacheControl(maxAge: 180) {
      tokenId: String!
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
      texts(forceLocale: String): ProductTexts
      catalogPrice(quantity: Int = 1, currency: String): Price
      leveledCatalogPrices(currency: String): [PriceLevel!]!
      simulatedPrice(
        currency: String
        useNetPrice: Boolean = false
        quantity: Int = 1
        configuration: [ProductConfigurationParameterInput!]
      ): Price @cacheControl(scope: PRIVATE, maxAge: 10)
      simulatedStocks(referenceDate: Timestamp): [Stock!] @cacheControl(scope: PRIVATE, maxAge: 10)
      assortmentPaths(forceLocale: String): [ProductAssortmentPath!]!
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
