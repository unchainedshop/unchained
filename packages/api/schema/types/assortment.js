export default [
  /* GraphQL */ `
    type AssortmentMediaTexts {
      _id: ID!
      locale: String
      title: String
      subtitle: String
    }

    type AssortmentMedia {
      _id: ID!
      tags: [String!]
      file: Media!
      sortKey: Int!
      texts(forceLocale: String): AssortmentMediaTexts
    }

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
      media(
        limit: Int = 10
        offset: Int = 0
        tags: [String!]
      ): [AssortmentMedia!]!
      texts(forceLocale: String): AssortmentTexts
      productAssignments: [AssortmentProduct!]
      filterAssignments: [AssortmentFilter!]
      linkedAssortments: [AssortmentLink!]
      assortmentPaths: [AssortmentPath!]!
      children(includeInactive: Boolean = false): [Assortment!]
      childrenCount(includeInactive: Boolean = false): Int!
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
      ): ProductSearchResult!
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

    type AssortmentProduct {
      _id: ID!
      sortKey: Int!
      tags: [String!]
      assortment: Assortment!
      product: Product!
    }

    type AssortmentFilter {
      _id: ID!
      sortKey: Int!
      tags: [String!]
      assortment: Assortment!
      filter: Filter!
    }

    type AssortmentLink {
      _id: ID!
      sortKey: Int!
      tags: [String!]
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
