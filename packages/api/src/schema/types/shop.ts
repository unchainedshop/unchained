export default [
  /* GraphQL */ `
    enum ExternalLinkTarget {
      """
      Open on new tab
      """
      BLANK
      """
      Open in own Iframe
      """
      SELF
    }
    type AdminUiLink @cacheControl(maxAge: 180) {
      href: String
      title: String
      target: ExternalLinkTarget
    }

    type AdminUiConfigCustomEntityInterface {
      entityName: String!
      inlineFragment: String!
    }

    type AdminUiConfig {
      customProperties: [AdminUiConfigCustomEntityInterface!]!
      externalLinks: [AdminUiLink!]!
      singleSignOnURL: String
      productTags: [String!]!
      assortmentTags: [String!]!
      userTags: [String!]!
    }

    type Shop @cacheControl(maxAge: 180) {
      _id: ID!
      language: Language
      country: Country
      version: String
      userRoles: [String!]!
      adminUiConfig: AdminUiConfig!
      vapidPublicKey: String

      """
      Runtime settings for the given namespace. Public namespaces are readable
      by anyone; private namespaces require the manageShopSettings permission.
      Returns null when the namespace is not registered.
      """
      settings(namespace: String!): JSON @cacheControl(maxAge: 0, scope: PRIVATE)
    }
  `,
];
