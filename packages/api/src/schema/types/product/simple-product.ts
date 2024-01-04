export default [
  /* GraphQL */ `
    """
    Simple Product
    """
    type SimpleProduct implements Product @cacheControl(maxAge: 180) {
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
        @cacheControl(scope: PRIVATE, maxAge: 10)
      simulatedDispatches(
        deliveryProviderType: DeliveryProviderType = SHIPPING
        referenceDate: Timestamp
        quantity: Int = 1
      ): [Dispatch!] @cacheControl(scope: PRIVATE, maxAge: 10)
      simulatedStocks(
        deliveryProviderType: DeliveryProviderType = SHIPPING
        referenceDate: Timestamp
      ): [Stock!] @cacheControl(scope: PRIVATE, maxAge: 10)
      assortmentPaths: [ProductAssortmentPath!]!
      siblings(
        assortmentId: ID
        limit: Int = 10
        offset: Int = 0
        includeInactive: Boolean = false
      ): [Product!]!
      dimensions: Dimensions
      sku: String
      baseUnit: String
      salesUnit: String
      salesQuantityPerUnit: String
      defaultOrderQuantity: Int
      reviews(
        limit: Int = 10
        offset: Int = 0
        sort: [SortOptionInput!]
        queryString: String
      ): [ProductReview!]!
      reviewsCount(queryString: String): Int!
    }
  `,
];
