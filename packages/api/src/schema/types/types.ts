export default [
  /* GraphQL */ `
    type SuccessResponse @cacheControl(maxAge: 0, scope: PRIVATE) {
      success: Boolean
    }

    type LogoutAllSessionsResponse @cacheControl(maxAge: 0, scope: PRIVATE) {
      success: Boolean!
      tokenVersion: Int!
    }

    enum SortDirection {
      ASC
      DESC
    }
  `,
];
