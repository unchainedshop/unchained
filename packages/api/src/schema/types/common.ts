export default [
  /* GraphQL */ `
    type SuccessResponse @cacheControl(maxAge: 0, scope: PRIVATE) {
      success: Boolean
    }

    type BulkOperationResult @cacheControl(maxAge: 0, scope: PRIVATE) {
      successCount: Int!
      failedCount: Int!
      failedIds: [ID!]!
    }

    enum SortDirection {
      ASC
      DESC
    }
  `,
];
