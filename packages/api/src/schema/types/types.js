export default [
  /* GraphQL */ `
    type SuccessResponse @cacheControl(maxAge: 0, scope: PRIVATE) {
      success: Boolean
    }

    enum SortDirection {
      ASC
      DESC
    }
  `,
];
