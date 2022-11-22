export default [
  /* GraphQL */ `
    enum SearchOrderBy {
      default
    }

    """
    Search result
    """
    type SearchResult @cacheControl(maxAge: 180) {
      productsCount: Int!
      filteredProductsCount: Int!
      filters: [LoadedFilter!]!
      products(limit: Int = 10, offset: Int = 0): [Product!]!
    }

    """
    Search result
    """
    type ProductSearchResult @cacheControl(maxAge: 180) {
      productsCount: Int!
      filteredProductsCount: Int!
      filters: [LoadedFilter!]!
      products(limit: Int = 10, offset: Int = 0): [Product!]!
    }

    type AssortmentSearchResult @cacheControl(maxAge: 180) {
      assortmentsCount: Int!
      assortments(limit: Int = 10, offset: Int = 0): [Assortment!]!
    }
  `,
];
