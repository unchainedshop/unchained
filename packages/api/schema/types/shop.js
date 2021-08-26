export default [
  /* GraphQL */ `
    type Link {
      href: String
      title: String
    }
    type Shop {
      _id: ID!
      language: Language
      country: Country
      version: String
      userRoles: [String!]!
      externalLinks: [Link]!
    }
  `,
];
