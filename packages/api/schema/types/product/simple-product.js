export default [
  /* GraphQL */ `
    """
    Simple Product
    """
    type SimpleProduct implements Product {
      _id: ID!
      sequence: Int!
      status: ProductStatus!
      tags: [String!]
      created: Date
      updated: Date
      published: Date
      media(limit: Int = 10, offset: Int = 0, tags: [String!]): [ProductMedia!]!
      texts(forceLocale: String): ProductTexts
      catalogPrice(quantity: Int = 1): ProductPrice
      simulatedPrice(
        useNetPrice: Boolean = false
        quantity: Int = 1
      ): ProductPrice
      simulatedDiscounts(quantity: Int = 1): [ProductDiscount!]
      simulatedDispatches(
        deliveryProviderType: DeliveryProviderType = SHIPPING
        referenceDate: Date
        quantity: Int = 1
      ): [Dispatch!]
      simulatedStocks(
        deliveryProviderType: DeliveryProviderType = SHIPPING
        referenceDate: Date
      ): [Stock!]
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
      reviews(limit: Int = 10, offset: Int = 0): [ProductReview!]!
      meta: JSON
    }
  `,
];
