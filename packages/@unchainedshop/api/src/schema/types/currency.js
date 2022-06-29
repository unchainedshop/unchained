export default [
  /* GraphQL */ `
    type Currency {
      _id: ID!
      isoCode: String!
      isActive: Boolean
      contractAddress: String
    }
  `,
];
