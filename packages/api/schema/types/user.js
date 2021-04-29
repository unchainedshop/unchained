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
      tokenExpires: Timestamp!

      """
      The logged in user
      """
      user: User
    }

    type UserProfile {
      displayName: String
      phoneMobile: String
      gender: String
      birthday: Timestamp
        @deprecated(
          reason: "Use strict format that is complient with the format (YYYY-mm-dd) refer to section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times for more information"
        )
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
      email: String
        @deprecated(reason: "Please use primaryEmail.address instead")
      username: String
      isEmailVerified: Boolean!
        @deprecated(reason: "Please use primaryEmail.verified instead")
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
      logs(offset: Int = 10, limit: Int = 0): [Log!]!
      bookmarks: [Bookmark!]!
      paymentCredentials: [PaymentCredentials!]!
      enrollments: [Enrollment!]!
    }
  `,
];
