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
      meta: JSON
      texts(forceLocale: String): AssortmentTexts
      productAssignments: [AssortmentProduct!]
      filterAssignments: [AssortmentFilter!]
      linkedAssortments: [AssortmentLink!]
      assortmentPaths: [AssortmentPath!]!
      children: [Assortment!]
      search(
        queryString: String
        filterQuery: [FilterQueryInput!]
        includeInactive: Boolean = false
        ignoreChildAssortments: Boolean = false
        orderBy: SearchOrderBy
      ): SearchResult! @deprecated(reason: "Please use searchProducts instead")
      searchProducts(
        queryString: String
        filterQuery: [FilterQueryInput!]
        includeInactive: Boolean = false
        ignoreChildAssortments: Boolean = false
        orderBy: SearchOrderBy
      ): SearchResult!
    }

    """
    Directed assortment to product paths (breadcrumbs)
    """
    type AssortmentPath {
      links: [AssortmentPathLink!]!
    }

    """
    A connection that represents an uplink from assortment to assortment,
    assortmentId and assortmentTexts are there for convenience
    to short-circuit breadcrumb lookups
    """
    type AssortmentPathLink {
      assortmentId: ID!
      assortmentSlug: String! @deprecated(reason: "Please use assortmentTexts")
      assortmentTexts(forceLocale: String): AssortmentTexts!
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
      tags: [String!]
      meta: JSON
      assortment: Assortment!
      product: Product!
    }

    type AssortmentFilter {
      _id: ID!
      sortKey: Int!
      tags: [String!]
      meta: JSON
      assortment: Assortment!
      filter: Filter!
    }

    type AssortmentLink {
      _id: ID!
      sortKey: Int!
      tags: [String!]
      meta: JSON
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
  `,
];
