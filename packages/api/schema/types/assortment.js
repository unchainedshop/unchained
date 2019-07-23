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
      paths(forceLocale: String): [AssortmentPath!]!
      children: [Assortment!]
      filters(query: [FilterQueryInput!]): [FilteredFilter!]
      products(
        limit: Int = 10
        offset: Int = 0
        query: [FilterQueryInput!]
      ): ProductCollection
    }

    """
    Directed assortment to product paths (breadcrumbs)
    """
    type AssortmentPath {
      links: [AssortmentPathLink!]!
    }

    """
    A connection that represents an uplink from assortment to assortment,
    assortmentId and assortmentSlug are there for convenience
    to short-circuit breadcrumb lookups
    """
    type AssortmentPathLink {
      assortmentId: ID!
      assortmentSlug: String!
      link: AssortmentLink
    }

    type ProductCollection {
      totalCount: Int!
      filteredCount: Int!
      items: [Product!]!
    }

    type AssortmentProduct {
      _id: ID!
      sortKey: Int!
      assortment: Assortment!
      product: Product!
    }

    type AssortmentFilter {
      _id: ID!
      sortKey: Int!
      assortment: Assortment!
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
