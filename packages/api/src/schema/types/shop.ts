export default [
  /* GraphQL */ `
    type Link @cacheControl(maxAge: 180) {
      href: String
      title: String
    }

    type CustomEntityInterface {
      entityName: String!
      inlineFragment: String!
    }

    type AdminUiConfig {
      customProperties: [CustomEntityInterface!]!
    }

    type Shop @cacheControl(maxAge: 180) {
      _id: ID!
      language: Language
      country: Country
      version: String
      userRoles: [String!]!
      externalLinks: [Link]!
      adminUiConfig: AdminUiConfig
    }
  `,
];
