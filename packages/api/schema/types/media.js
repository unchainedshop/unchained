export default [
  /* GraphQL */ `
    type Media {
      _id: ID!
      name: String!
      type: String!
      size: Int!
      url(version: String = "original", baseUrl: String): String!
      meta: JSON
        @deprecated(
          reason: "Due to ambiguity this field will be removed on future releases,Please write a custom resolver that reflects your business-logic"
        )
    }
  `,
];
