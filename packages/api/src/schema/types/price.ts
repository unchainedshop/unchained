export default [
  /* GraphQL */ `
    type Price @cacheControl(maxAge: 60) {
      isTaxable: Boolean!
      isNetPrice: Boolean!
      amount: Int!
      currency: String!
    }

    type PriceRange @cacheControl(maxAge: 60) {
      minPrice: Price!
      maxPrice: Price!
    }
  `,
];
