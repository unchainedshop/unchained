import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IUserWebAuthnCredentialsQuery,
  IUserWebAuthnCredentialsQueryVariables,
} from '../../../gql/types';
import MD5MetaDataFragment from '../fragment/MD5MetaDataFragment';

const UserWebAuthnCredentialsQuery = gql`
  query UserWebAuthnCredentials($userId: ID!) {
    user(userId: $userId) {
      _id
      webAuthnCredentials {
        _id
        created
        aaguid
        counter
        mdsMetadata {
          ...MD5MetaDataFragment
        }
      }
    }
  }
  ${MD5MetaDataFragment}
`;

const useUserWebAuthnCredentials = ({
  userId,
}: IUserWebAuthnCredentialsQueryVariables) => {
  const { data, loading, error } = useQuery<
    IUserWebAuthnCredentialsQuery,
    IUserWebAuthnCredentialsQueryVariables
  >(UserWebAuthnCredentialsQuery, {
    variables: { userId },
  });

  return {
    webAuthnCredentials: data?.user?.webAuthnCredentials,
    loading,
    error,
  };
};

export default useUserWebAuthnCredentials;
