export default [
  /* GraphQL */ `
    type Shop {
      _id: ID!
      language: Language
      country: Country
      version: String
      userRoles: [String!]!
    }
  `
];
