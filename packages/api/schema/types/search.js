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
        @deprecated(reason: "Renamed, use the productsCount field")
      productsCount: Int!
      filteredProducts: Int!
        @deprecated(reason: "Renamed, use the filteredProductsCount field")
      filteredProductsCount: Int!
      filters: [LoadedFilter!]!
      products(limit: Int = 10, offset: Int = 0): [Product!]!
    }

    """
    Search result
    """
    type ProductSearchResult {
      totalProducts: Int!
        @deprecated(reason: "Renamed, use the productsCount field")
      productsCount: Int!
      filteredProducts: Int!
        @deprecated(reason: "Renamed, use the filteredProductsCount field")
      filteredProductsCount: Int!
      filters: [LoadedFilter!]!
      products(limit: Int = 10, offset: Int = 0): [Product!]!
    }

    type AssortmentSearchResult {
      totalAssortments: Int!
        @deprecated(reason: "Renamed, use the assortmentsCount field")
      assortmentsCount: Int!
      assortments(limit: Int = 10, offset: Int = 0): [Assortment!]!
    }
  `,
];
