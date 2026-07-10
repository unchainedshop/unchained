import {
  IFailedLoginAttemptsQuery,
  IFailedLoginAttemptsQueryVariables,
} from '@/gql/types';
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
}: IFailedLoginAttemptsQueryVariables = {}) => {
  const { data, loading, error, refetch } = useQuery<
    IFailedLoginAttemptsQuery,
    IFailedLoginAttemptsQueryVariables
  >(FailedLoginAttemptsQuery, {
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
