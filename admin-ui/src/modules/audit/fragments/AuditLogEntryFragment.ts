import { gql } from '@apollo/client';

const AuditLogEntryFragment = gql`
  fragment AuditLogEntryFragment on AuditLogEntry {
    id
    time
    message
    classUid
    className
    activityId
    activityName
    typeUid
    categoryUid
    severityId
    statusId
    statusDetail
    actor {
      user {
        uid
        name
        emailAddr
      }
      session {
        uid
      }
    }
    srcEndpoint {
      ip
      port
    }
    dstEndpoint {
      ip
      port
    }
    api {
      operation
      request {
        uid
      }
      response {
        code
      }
    }
    metadata
    sequenceNumber
    prevHash
    hash
    raw
  }
`;

export default AuditLogEntryFragment;
