export default [
  /* GraphQL */ `
    type Media @cacheControl(maxAge: 180) {
      _id: ID!
      name: String!
      type: String!
      size: Int!
      url(version: String = "original", baseUrl: String): String
    }
  `,
];
