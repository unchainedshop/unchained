export default [
  /* GraphQL */ `
    type Event {
      _id: ID!
      type: String!
      payload: JSON
      created: Timestamp!
    }
  `,
];
