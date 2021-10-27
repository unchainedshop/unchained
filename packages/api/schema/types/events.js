export default [
  /* GraphQL */ `
    enum EventType

    type Event {
      _id: ID!
      type: String!
      payload: JSON
      created: Timestamp!
    }
  `,
];
