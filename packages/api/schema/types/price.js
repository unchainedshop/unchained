export default [
  /* GraphQL */ `
    type Price {
      _id: ID!
      isTaxable: Boolean!
      isNetPrice: Boolean!
      amount: Int!
      currency: String!
    }
  `,
];
