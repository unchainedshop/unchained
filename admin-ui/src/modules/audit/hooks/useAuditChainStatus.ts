import {
  IAuditChainStatusQuery,
  IAuditChainStatusQueryVariables,
} from '@/gql/types';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const AuditChainStatusQuery = gql`
  query AuditChainStatus {
    auditChainStatus {
      valid
      totalEntries
      checkedEntries
      firstEntry
      lastEntry
      errors {
        sequenceNumber
        message
      }
    }
  }
`;

const useAuditChainStatus = () => {
  const { data, loading, error, refetch } = useQuery<
    IAuditChainStatusQuery,
    IAuditChainStatusQueryVariables
  >(AuditChainStatusQuery);

  return {
    chainStatus: data?.auditChainStatus,
    loading,
    error,
    refetch,
  };
};

export default useAuditChainStatus;
