export default [
  /* GraphQL */ `
    type Price {
      _id: ID!
      isTaxable: Boolean!
      isNetPrice: Boolean!
      amount: BigInt!
      currency: String!
    }

    type PriceRange {
      _id: ID!
      minPrice: Price!
      maxPrice: Price!
    }
  `,
];
