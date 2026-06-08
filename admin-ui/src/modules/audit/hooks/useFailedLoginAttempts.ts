import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const FailedLoginAttemptsQuery = gql`
  query FailedLoginAttempts(
    $userId: String
    $remoteAddress: String
    $since: Timestamp
  ) {
    failedLoginAttempts(
      userId: $userId
      remoteAddress: $remoteAddress
      since: $since
    )
  }
`;

const useFailedLoginAttempts = ({
  userId = null,
  remoteAddress = null,
  since = null,
}: {
  userId?: string | null;
  remoteAddress?: string | null;
  since?: number | null;
} = {}) => {
  const { data, loading, error, refetch } = useQuery<{
    failedLoginAttempts: number;
  }>(FailedLoginAttemptsQuery, {
    variables: { userId, remoteAddress, since },
  });

  return {
    failedLoginAttempts: data?.failedLoginAttempts ?? 0,
    loading,
    error,
    refetch,
  };
};

export default useFailedLoginAttempts;
