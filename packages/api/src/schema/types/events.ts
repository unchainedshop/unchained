export default [
  /* GraphQL */ `
    enum EventType {
      UNKNOWN
    }

    type Event {
      _id: ID!
      type: String!
      payload: JSON
      created: Timestamp!
    }

    type EventStatistics {
      event: EventType!
      count: Int!
    }
  `,
];
