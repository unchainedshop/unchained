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
    }

    type FilterTexts {
      _id: ID!
      locale: String
      title: String
      subtitle: String
    }

    type FilterOption {
      _id: ID!
      texts(forceLocale: String): FilterTexts
      value: String
    }

    type Filter {
      _id: ID!
      updated: Date
      created: Date
      isActive: Boolean
      texts(forceLocale: String): FilterTexts
      type: FilterType
      key: String
      options: [FilterOption!]
    }

    type LoadedFilterOption {
      filteredProducts: Int!
      option: FilterOption!
      remaining: Int @deprecated(reason: "Use filteredProducts instead")
      active: Boolean
    }

    type LoadedFilter {
      examinedProducts: Int!
      filteredProducts: Int!
      filter: Filter!
      remaining: Int! @deprecated(reason: "Use examinedProducts instead")
      active: Boolean
      filteredOptions: [LoadedFilterOption!]
    }
  `
];
