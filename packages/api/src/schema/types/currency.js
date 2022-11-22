export default [
  /* GraphQL */ `
    type Currency @cacheControl(maxAge: 180) {
      _id: ID!
      isoCode: String!
      isActive: Boolean
      contractAddress: String
      decimals: Int
    }
  `,
];
