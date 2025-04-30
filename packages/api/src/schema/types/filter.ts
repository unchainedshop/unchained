export default [
  /* GraphQL */ `
    enum FilterType {
      """
      Switch / Boolean
      """
      SWITCH

      """
      Single-choice
      """
      SINGLE_CHOICE

      """
      Multi-choice
      """
      MULTI_CHOICE

      """
      Range
      """
      RANGE
    }

    type FilterTexts @cacheControl(maxAge: 180) {
      _id: ID!
      locale: Locale
      title: String
      subtitle: String
    }

    type FilterOption @cacheControl(maxAge: 180) {
      _id: ID!
      texts(forceLocale: Locale): FilterTexts
      value: String
    }

    type Filter @cacheControl(maxAge: 180) {
      _id: ID!
      updated: DateTime
      created: DateTime
      isActive: Boolean
      texts(forceLocale: Locale): FilterTexts
      type: FilterType
      key: String
      options: [FilterOption!]
    }

    type LoadedFilterOption @cacheControl(maxAge: 180) {
      filteredProductsCount: Int!
      definition: FilterOption!
      isSelected: Boolean
    }

    type LoadedFilter @cacheControl(maxAge: 180) {
      productsCount: Int!
      filteredProductsCount: Int!
      definition: Filter!
      isSelected: Boolean
      options: [LoadedFilterOption!]
    }
  `,
];
