import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import AuditLogEntryFragment from '../fragments/AuditLogEntryFragment';

const AuditLogsQuery = gql`
  query AuditLogs(
    $limit: Int
    $offset: Int
    $classUids: [Int!]
    $userId: String
    $success: Boolean
    $from: Timestamp
    $until: Timestamp
  ) {
    auditLogs(
      limit: $limit
      offset: $offset
      classUids: $classUids
      userId: $userId
      success: $success
      from: $from
      until: $until
    ) {
      ...AuditLogEntryFragment
    }
    auditLogsCount(
      classUids: $classUids
      userId: $userId
      success: $success
      from: $from
      until: $until
    )
  }
  ${AuditLogEntryFragment}
`;

const useAuditLogs = ({
  limit = 50,
  offset = 0,
  classUids = null,
  userId = null,
  success = null,
  from = null,
  until = null,
}: {
  limit?: number;
  offset?: number;
  classUids?: number[] | null;
  userId?: string | null;
  success?: boolean | null;
  from?: number | null;
  until?: number | null;
} = {}) => {
  const { data, loading, error, fetchMore, previousData } = useQuery<{
    auditLogs: any[];
    auditLogsCount: number;
  }>(AuditLogsQuery, {
    variables: { limit, offset, classUids, userId, success, from, until },
  });

  const auditLogs = data?.auditLogs || previousData?.auditLogs || [];
  const auditLogsCount =
    data?.auditLogsCount ?? previousData?.auditLogsCount ?? 0;
  const hasMore = auditLogs.length < auditLogsCount;

  const loadMore = () => {
    if (loading) return;
    fetchMore({ variables: { offset: auditLogs.length } });
  };

  return { auditLogs, auditLogsCount, hasMore, loadMore, loading, error };
};

export default useAuditLogs;
