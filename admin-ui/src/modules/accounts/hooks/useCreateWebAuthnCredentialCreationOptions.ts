import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ICreateWebAuthnCredentialCreationOptionsMutation,
  ICreateWebAuthnCredentialCreationOptionsMutationVariables,
} from '../../../gql/types';

const CreateWebAuthnCredentialCreationOptionsMutation = gql`
  mutation CreateWebAuthnCredentialCreationOptions($username: String!) {
    createWebAuthnCredentialCreationOptions(username: $username)
  }
`;

const useCreateWebAuthnCredentialCreationOptions = () => {
  const [createWebAuthnCredentialCreationOptionsMutation] = useMutation<
    ICreateWebAuthnCredentialCreationOptionsMutation,
    ICreateWebAuthnCredentialCreationOptionsMutationVariables
  >(CreateWebAuthnCredentialCreationOptionsMutation);

  const createWebAuthnCredentialCreationOptions = async ({
    username,
  }: ICreateWebAuthnCredentialCreationOptionsMutationVariables) => {
    return createWebAuthnCredentialCreationOptionsMutation({
      variables: { username },
    });
  };

  return { createWebAuthnCredentialCreationOptions };
};

export default useCreateWebAuthnCredentialCreationOptions;
