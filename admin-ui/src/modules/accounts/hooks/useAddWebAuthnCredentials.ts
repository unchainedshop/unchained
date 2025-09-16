import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IAddWebAuthnCredentialsMutation,
  IAddWebAuthnCredentialsMutationVariables,
} from '../../../gql/types';
import MD5MetaDataFragment from '../fragment/MD5MetaDataFragment';
import UserFragment from '../fragment/UserFragment';

const AddWebAuthnCredentialsMutation = gql`
  mutation AddWebAuthnCredentials($credentials: JSON!) {
    addWebAuthnCredentials(credentials: $credentials) {
      ...UserFragment
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
  ${UserFragment}
  ${MD5MetaDataFragment}
`;

const useAddWebAuthnCredentials = () => {
  const [addWebAuthnCredentialsMutation] = useMutation<
    IAddWebAuthnCredentialsMutation,
    IAddWebAuthnCredentialsMutationVariables
  >(AddWebAuthnCredentialsMutation);

  const addWebAuthnCredentials = async ({
    credentials,
  }: IAddWebAuthnCredentialsMutationVariables) => {
    return addWebAuthnCredentialsMutation({
      variables: { credentials },
    });
  };

  return {
    addWebAuthnCredentials,
  };
};

export default useAddWebAuthnCredentials;
