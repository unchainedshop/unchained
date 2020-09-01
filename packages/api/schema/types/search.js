export default [
  /* GraphQL */ `
    enum SearchOrderBy {
      default
    }

    """
    Product search result
    """
    type ProductSearchResult {
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
