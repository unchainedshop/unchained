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
      filteredProducts: Int!
      filters: [LoadedFilter!]!
      products(limit: Int = 10, offset: Int = 0): [Product!]!
    }

    """
    Search result
    """
    type ProductSearchResult {
      totalProducts: Int!
      filteredProducts: Int!
      filters: [LoadedFilter!]!
      products(limit: Int = 10, offset: Int = 0): [Product!]!
    }

    type AssortmentSearchResult {
      totalAssortments: Int!
      assortments(limit: Int = 10, offset: Int = 0): [Assortment!]!
    }
  `,
];
