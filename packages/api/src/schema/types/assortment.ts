export default [
  /* GraphQL */ `
    type AssortmentMediaTexts @cacheControl(maxAge: 180) {
      _id: ID!
      locale: Locale
      title: String
      subtitle: String
    }

    type AssortmentMedia @cacheControl(maxAge: 180) {
      _id: ID!
      tags: [LowerCaseString!]
      file: Media
      sortKey: Int!
      texts(forceLocale: Locale): AssortmentMediaTexts
    }

    """
    Assortment
    """
    type Assortment @cacheControl(maxAge: 180) {
      _id: ID!
      created: DateTime
      updated: DateTime
      deleted: DateTime
      isActive: Boolean
      isBase: Boolean
      isRoot: Boolean
      sequence: Int!
      tags: [LowerCaseString!]
      media(limit: Int = 10, offset: Int = 0, tags: [LowerCaseString!]): [AssortmentMedia!]!
      texts(forceLocale: Locale): AssortmentTexts
      productAssignments: [AssortmentProduct!]
      filterAssignments: [AssortmentFilter!]
      linkedAssortments: [AssortmentLink!]
      assortmentPaths: [AssortmentPath!]!
      children(includeInactive: Boolean = false): [Assortment!]
      childrenCount(includeInactive: Boolean = false): Int!
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
    type AssortmentPath @cacheControl(maxAge: 180) {
      links: [AssortmentPathLink!]!
    }

    """
    A connection that represents an uplink from assortment to assortment,
    assortmentId and assortmentTexts are there for convenience
    to short-circuit breadcrumb lookups
    """
    type AssortmentPathLink @cacheControl(maxAge: 180) {
      assortmentId: ID!
      assortmentTexts(forceLocale: Locale): AssortmentTexts!
      link: AssortmentLink
    }

    type AssortmentProduct @cacheControl(maxAge: 180) {
      _id: ID!
      sortKey: Int!
      tags: [LowerCaseString!]
      assortment: Assortment!
      product: Product!
    }

    type AssortmentFilter @cacheControl(maxAge: 180) {
      _id: ID!
      sortKey: Int!
      tags: [LowerCaseString!]
      assortment: Assortment!
      filter: Filter!
    }

    type AssortmentLink @cacheControl(maxAge: 180) {
      _id: ID!
      sortKey: Int!
      tags: [LowerCaseString!]
      parent: Assortment!
      child: Assortment!
    }

    type AssortmentTexts @cacheControl(maxAge: 180) {
      _id: ID!
      locale: Locale
      slug: String
      title: String
      subtitle: String
      description: String
    }
  `,
];
