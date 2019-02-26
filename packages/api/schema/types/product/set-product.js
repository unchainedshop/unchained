export default [
  /* GraphQL */ `
    """
    A set product consists of multiple sub products
    """
    type SetProduct implements Product {
      _id: ID!
      sequence: Int!
      status: ProductStatus!
      tags: [String!]
      created: Date
      updated: Date
      published: Date
      media(vectors: [ProductAssignmentVectorInput!]): [ProductMedia!]
      texts(forceLocale: String): ProductTexts
      setItems: [ProductSetItem!]
      reviews(limit: Int, offset: Int): [ProductReview!]!
    }

    type ProductSetItem {
      product: Product!
      quantity: Int!
    }
  `,
];
