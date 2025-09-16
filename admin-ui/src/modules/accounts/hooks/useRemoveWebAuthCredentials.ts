import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveWebAuthCredentialsMutation,
  IRemoveWebAuthCredentialsMutationVariables,
} from '../../../gql/types';
import UserFragment from '../fragment/UserFragment';

const RemoveWebAuthCredentialsMutation = gql`
  mutation removeWebAuthCredentials($credentialsId: ID!) {
    removeWebAuthnCredentials(credentialsId: $credentialsId) {
      ...UserFragment
    }
  }
  ${UserFragment}
`;

const useRemoveWebAuthCredentials = () => {
  const [removeWebAuthCredentialsMutation] = useMutation<
    IRemoveWebAuthCredentialsMutation,
    IRemoveWebAuthCredentialsMutationVariables
  >(RemoveWebAuthCredentialsMutation);
  const removeWebAuthCredentials = async ({
    credentialsId,
  }: IRemoveWebAuthCredentialsMutationVariables) => {
    return removeWebAuthCredentialsMutation({
      variables: { credentialsId },
    });
  };

  return {
    removeWebAuthCredentials,
  };
};

export default useRemoveWebAuthCredentials;
