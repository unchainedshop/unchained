export default [
  /* GraphQL */ `
    """
    Type returned when the user logs in
    """
    type LoginMethodResponse {
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
      tokenExpires: Date!

      """
      The logged in user
      """
      user: User
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
      timestamp: Date!
      remoteAddress: String
      locale: String
      countryCode: String
    }

    type User {
      _id: ID!
      email: String
        @deprecated(reason: "Please use primaryEmail.address instead")
      username: String
      isEmailVerified: Boolean!
        @deprecated(reason: "Please use primaryEmail.verified instead")
      isGuest: Boolean!
      isInitialPassword: Boolean!
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
      tags: [String!]
      cart(orderNumber: String): Order
      orders(includeCarts: Boolean = false): [Order!]!
      quotations: [Quotation!]!
      logs(offset: Int = 10, limit: Int = 0): [Log!]!
      bookmarks: [Bookmark!]!
      paymentCredentials: [PaymentCredentials!]!
      subscriptions: [Subscription!]!
    }
  `
];
