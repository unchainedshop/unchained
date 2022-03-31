export default [
  /* GraphQL */ `
    enum RoleAction

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
      tokenExpires: DateTime!

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
      timestamp: Timestamp!
      remoteAddress: String
      remotePort: String
      userAgent: String
      locale: String
      countryCode: String
    }

    type User {
      _id: ID!
      email: String @deprecated(reason: "Please use primaryEmail.address instead")
      username: String
      isEmailVerified: Boolean! @deprecated(reason: "Please use primaryEmail.verified instead")
      isGuest: Boolean!
      isTwoFactorEnabled: Boolean!
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
      bookmarks: [Bookmark!]!
      paymentCredentials: [PaymentCredentials!]!
      enrollments: [Enrollment!]!
      allowedActions: [RoleAction!]!
    }
  `,
];
