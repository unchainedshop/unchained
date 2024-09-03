export default [
  /* GraphQL */ `
    enum RoleAction

    """
    Type returned when the user logs in
    """
    type LoginMethodResponse @cacheControl(maxAge: 0, scope: PRIVATE) {
      """
      Id of the user logged in user
      """
      id: String!

      """
      Token of the connection
      """
      token: String!

      """
      Expiration date for the token
      """
      tokenExpires: DateTime!

      """
      The logged in user
      """
      user: User
    }

    type PushSubscription {
      _id: ID!
      userAgent: String
      expirationTime: Timestamp
      endpoint: String!
    }

    type UserProfile {
      displayName: String
      phoneMobile: String
      gender: String
      birthday: Date
      address: Address
    }

    type UserEmail {
      address: String!
      verified: Boolean!
    }

    type UserLoginTracker {
      timestamp: Timestamp!
      remoteAddress: String
      remotePort: String
      userAgent: String
      locale: String
      countryCode: String
    }

    type WebAuthnMDSv3Metadata {
      legalHeader: String
      description: String
      authenticatorVersion: Int
      protocolFamily: String
      schema: Int
      upv: [JSON!]
      authenticationAlgorithms: [String!]
      publicKeyAlgAndEncodings: [String!]
      attestationTypes: [String!]
      userVerificationDetails: [JSON!]
      keyProtection: [String!]
      matcherProtection: [String!]
      cryptoStrength: Int
      attachmentHint: [String!]
      tcDisplay: [JSON!]
      attestationRootCertificates: [String!]
      icon: String
      authenticatorGetInfo: JSON
    }

    type WebAuthnCredentials {
      _id: ID!
      created: DateTime!
      aaguid: String!
      counter: Int!
      mdsMetadata: WebAuthnMDSv3Metadata
    }

    type Web3Address {
      address: String!
      nonce: Int
      verified: Boolean!
    }

    type OAuthProvider {
      _id: String!
      clientId: String!
      scopes: [String!]!
    }

    type OAuthAccount {
      _id: ID!
      provider: OAuthProvider!
      authorizationCode: String!
    }

    type User {
      _id: ID!
      created: DateTime!
      updated: DateTime
      deleted: DateTime
      username: String
      isGuest: Boolean!
      isTwoFactorEnabled: Boolean!
      isInitialPassword: Boolean!
      webAuthnCredentials: [WebAuthnCredentials!]!
      web3Addresses: [Web3Address!]!
      pushSubscriptions: [PushSubscription!]!
      name: String!
      avatar: Media
      profile: UserProfile
      language: Language
      country: Country
      lastBillingAddress: Address
      lastContact: Contact
      lastLogin: UserLoginTracker
      primaryEmail: UserEmail
      emails: [UserEmail!]
      roles: [String!]
      tags: [LowerCaseString!]
      cart(orderNumber: String): Order
      orders(
        limit: Int
        offset: Int
        status: [OrderStatus!]!
        queryString: String
        sort: [SortOptionInput!]
        includeCarts: Boolean = false
      ): [Order!]!
      quotations(
        sort: [SortOptionInput!]
        queryString: String
        limit: Int = 10
        offset: Int = 0
      ): [Quotation!]!
      bookmarks: [Bookmark!]!
      paymentCredentials: [PaymentCredentials!]!
      enrollments(
        limit: Int
        offset: Int
        queryString: String
        status: [String!]
        sort: [SortOptionInput!]
      ): [Enrollment!]!
      allowedActions: [RoleAction!]!
      tokens: [Token!]!
      oAuthAccounts: [OAuthAccount!]!
      reviews(limit: Int = 10, offset: Int = 0, sort: [SortOptionInput!]): [ProductReview!]!
      reviewsCount: Int!
    }
  `,
];
