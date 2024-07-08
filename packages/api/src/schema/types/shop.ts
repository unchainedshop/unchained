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
    type Link @cacheControl(maxAge: 180) {
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
    }

    type ActivityReport {
      today: [JSON]!
      all: [JSON]!
      sinceInstanceStart: [JSON]!
    }

    type ShopAnalytics {
      instanceStartTime: Timestamp
      startOfToday: Timestamp
      workItems: ActivityReport!
      events: ActivityReport!
      orders: ActivityReport!
    }
    type Shop @cacheControl(maxAge: 180) {
      _id: ID!
      language: Language
      country: Country
      version: String
      userRoles: [String!]!
      externalLinks: [Link]!
      adminUiConfig: AdminUiConfig!
      oAuthProviders: [OAuthProvider!]!
      vapidPublicKey: String
    }
  `,
];
