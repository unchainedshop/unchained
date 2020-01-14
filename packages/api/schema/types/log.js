export default [
  /* GraphQL */ `
    """
    Server side log entry, that is contextually augmented with user & order
    """
    type Log {
      _id: ID!
      created: Date!
      level: String!
      message: String!
      user: User
      order: Order
      tracking: Tracking
    }

    """
    Fields to identify a remote user
    """
    type Tracking {
      remoteAddress: String
      remotePort: String
      userAgent: String
    }
  `
];
