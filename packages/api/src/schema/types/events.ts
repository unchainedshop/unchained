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

    type EventStatisticReportDetail {
      date: Date!
      emitCount: Int!
    }
    type EventStatisticReport {
      detail: [EventStatisticReportDetail!]!
      total: String
      type: String
    }

    type EventStatistics {
      report: [EventStatisticReport!]!
      total: Int!
    }
  `,
];
