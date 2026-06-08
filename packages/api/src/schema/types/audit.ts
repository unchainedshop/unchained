export default [
  /* GraphQL */ `
    type AuditLogUser {
      uid: String
      name: String
      emailAddr: String
    }

    type AuditLogActor {
      user: AuditLogUser
      session: AuditLogSession
    }

    type AuditLogSession {
      uid: String
    }

    type AuditLogEndpoint {
      ip: String
      port: Int
    }

    type AuditLogApi {
      operation: String
      request: AuditLogApiRequest
      response: AuditLogApiResponse
    }

    type AuditLogApiRequest {
      uid: String
    }

    type AuditLogApiResponse {
      code: Int
    }

    type AuditLogEntry {
      id: ID!
      time: Float!
      message: String
      classUid: Int!
      className: String!
      activityId: Int!
      activityName: String
      typeUid: Int!
      categoryUid: Int!
      severityId: Int!
      statusId: Int!
      statusDetail: String
      actor: AuditLogActor
      srcEndpoint: AuditLogEndpoint
      api: AuditLogApi
      sequenceNumber: Int
      prevHash: String
      hash: String
      raw: JSON
    }

    type AuditChainStatus {
      valid: Boolean!
      totalEntries: Int!
      checkedEntries: Int!
      firstEntry: Float
      lastEntry: Float
      errors: [AuditChainError!]!
    }

    type AuditChainError {
      sequenceNumber: Int!
      message: String!
    }
  `,
];
