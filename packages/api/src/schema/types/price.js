export default [
  /* GraphQL */ `
    type Price @cacheControl(maxAge: 60) {
      _id: ID!
      isTaxable: Boolean!
      isNetPrice: Boolean!
      amount: Int!
      currency: String!
    }

    type PriceRange @cacheControl(maxAge: 60) {
      _id: ID!
      minPrice: Price!
      maxPrice: Price!
    }
  `,
];
