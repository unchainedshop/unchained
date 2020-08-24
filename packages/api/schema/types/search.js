export default [
  /* GraphQL */ `
    enum SearchOrderBy {
      default
    }

    """
    Search result
    """
    type SearchResult {
      totalProducts: Int!
      totalAssortments: Int!
      filteredProducts: Int!
      filters: [LoadedFilter!]!
      products(limit: Int = 10, offset: Int = 0): [Product!]!
      assortments(limit: Int = 10, offset: Int = 0): [Assortment!]!
    }
  `,
];
