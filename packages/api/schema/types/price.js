export default [
  /* GraphQL */ `
    type Price {
      _id: ID!
      isTaxable: Boolean!
      isNetPrice: Boolean!
      amount: Int!
      currency: String!
    }

    type PriceRange {
      _id: ID!
      minPrice: Price!
      maxPrice: Price!
    }
  `,
];
