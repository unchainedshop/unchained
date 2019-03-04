export default [
  /* GraphQL */ `
    """
    Assortment
    """
    type Assortment {
      _id: ID!
      created: Date
      updated: Date
      isActive: Boolean
      isBase: Boolean
      isRoot: Boolean
      sequence: Int!
      tags: [String!]
      texts(forceLocale: String): AssortmentTexts
      productAssignments: [AssortmentProduct!]
      filterAssignments: [AssortmentFilter!]
      linkedAssortments: [AssortmentLink!]
      children: [Assortment!]
      filters(query: [FilterQueryInput!]): [FilteredFilter!]
      products(
        limit: Int
        offset: Int
        query: [FilterQueryInput!]
      ): ProductCollection
    }

    type ProductCollection {
      totalCount: Int!
      filteredCount: Int!
      items: [Product!]!
    }

    type AssortmentProduct {
      _id: ID!
      sortKey: Int!
      product: Product!
    }

    type AssortmentFilter {
      _id: ID!
      sortKey: Int!
      filter: Filter!
    }

    type AssortmentLink {
      _id: ID!
      sortKey: Int!
      parent: Assortment!
      child: Assortment!
    }

    type AssortmentTexts {
      _id: ID!
      locale: String
      slug: String
      title: String
      subtitle: String
      description: String
    }
  `
];
