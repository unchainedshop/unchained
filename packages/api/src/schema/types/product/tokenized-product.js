export default [
  /* GraphQL */ `
    input UpdateProductTokenizationInput {
      contractAddress: String!
      contractStandard: SmartContractStandard!
      tokenId: String
      supply: Int
    }

    enum SmartContractStandard {
      ERC1155
      ERC721
    }

    type ContractConfiguration {
      tokenId: String
      supply: Int
    }

    """
    Tokenized Product (Blockchain materialized Product)
    """
    type TokenizedProduct implements Product {
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
      simulatedPrice(currency: String, useNetPrice: Boolean = false, quantity: Int = 1): Price
      simulatedDiscounts(quantity: Int = 1): [ProductDiscount!]
      simulatedStocks(referenceDate: Timestamp): [Stock!]
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
      contractAddress: String
      contractStandard: SmartContractStandard
      contractConfiguration: ContractConfiguration
    }
  `,
];
