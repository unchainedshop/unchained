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

    type User {
      _id: ID!
      email: String
      username: String
      isEmailVerified: Boolean!
      isGuest: Boolean!
      isInitialPassword: Boolean!
      name: String!
      avatar: Media
      profile: UserProfile
      language: Language
      country: Country
      lastBillingAddress: Address
      lastDeliveryAddress: Address
      lastContact: Contact
      emails: [UserEmail!]
      roles: [String!]
      tags: [String!]
      cart(orderNumber: String): Order
      orders(includeCarts: Boolean = false): [Order!]!
      quotations: [Quotation!]!
      logs(offset: Int = 10, limit: Int = 0): [Log!]!
    }
  `
];
