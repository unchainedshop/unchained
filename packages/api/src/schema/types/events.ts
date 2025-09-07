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

    type EventStatisticReport {
      date: Date!
      count: Int!
    }

    type EventStatistics {
      detail: [EventStatisticReport!]!
      emitCount: Int!
      type: String
    }
  `,
];
