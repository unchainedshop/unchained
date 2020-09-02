export default [
  /* GraphQL */ `
    enum SearchOrderBy {
      default
    }

    directive @deprecated(
      reason: String = "No longer supported"
    ) on FIELD_DEFINITION | ENUM_VALUE

    """
    Search result
    """
    type SearchResult {
      totalProducts: Int!
      filteredProducts: Int!
      filters: [LoadedFilter!]!
      products(limit: Int = 10, offset: Int = 0): [Product!]!
    }

    type AssortmentSearchResult {
      assortments(limit: Int = 10, offset: Int = 0): [Assortment!]!
    }
  `,
];
