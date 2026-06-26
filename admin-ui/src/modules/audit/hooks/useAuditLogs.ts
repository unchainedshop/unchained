import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import AuditLogEntryFragment from '../fragments/AuditLogEntryFragment';
import { IAuditLogsQuery, IAuditLogsQueryVariables } from '@/gql/types';

const AuditLogsQuery = gql`
  query AuditLogs(
    $limit: Int
    $offset: Int
    $classUids: [Int!]
    $userId: String
    $success: Boolean
    $from: Timestamp
    $to: Timestamp
    $queryText: String
  ) {
    auditLogs(
      limit: $limit
      offset: $offset
      classUids: $classUids
      userId: $userId
      success: $success
      from: $from
      to: $to
      queryText: $queryText
    ) {
      ...AuditLogEntryFragment
    }
    auditLogsCount(
      classUids: $classUids
      userId: $userId
      success: $success
      from: $from
      to: $to
      queryText: $queryText
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
  to = null,
  queryText = null,
}: IAuditLogsQueryVariables = {}) => {
  const { data, loading, error, fetchMore, previousData, networkStatus } =
    useQuery<IAuditLogsQuery, IAuditLogsQueryVariables>(AuditLogsQuery, {
      variables: {
        limit,
        offset,
        classUids,
        userId,
        success,
        from,
        to,
        queryText,
      },
      notifyOnNetworkStatusChange: true,
    });

  const isFetchingMore = networkStatus === 3;
  const auditLogs =
    data?.auditLogs || (isFetchingMore ? previousData?.auditLogs : null) || [];
  const auditLogsCount =
    data?.auditLogsCount ??
    (isFetchingMore ? previousData?.auditLogsCount : null) ??
    0;
  const hasMore = auditLogs.length > 0 && auditLogs.length < auditLogsCount;

  const loadMore = () => {
    if (loading || isFetchingMore) return;
    fetchMore({ variables: { offset: auditLogs.length } });
  };

  return {
    auditLogs,
    auditLogsCount,
    hasMore,
    loadMore,
    loading: loading && !isFetchingMore,
    loadingMore: isFetchingMore,
    error,
  };
};

export default useAuditLogs;
