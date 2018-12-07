export default [/* GraphQL */`
"""
Matrix Product
"""
type ConfigurableProduct implements Product {
  _id: ID!
  sequence: Int!
  status: ProductStatus!
  tags: [String!]
  created: Date
  updated: Date
  published: Date
  media(vectors: [ProductAssignmentVectorInput!]): [ProductMedia!]
  texts(forceLocale: String): ProductTexts
  variations: [ProductVariation!]
  products(vectors: [ProductAssignmentVectorInput!]): [Product!]
  assignments: [ProductVariationAssignment!]!
}
`];
