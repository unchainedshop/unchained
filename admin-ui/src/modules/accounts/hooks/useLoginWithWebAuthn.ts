import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ILoginWithWebAuthnMutation,
  ILoginWithWebAuthnMutationVariables,
} from '../../../gql/types';

const LogWithWebAuthnMutation = gql`
  mutation LoginWithWebAuthn($webAuthnPublicKeyCredentials: JSON!) {
    loginWithWebAuthn(
      webAuthnPublicKeyCredentials: $webAuthnPublicKeyCredentials
    ) {
      _id
      tokenExpires
    }
  }
`;

const useLoginWithWebAuthn = () => {
  const [loginWithWebAuthnMutation, { client }] = useMutation<
    ILoginWithWebAuthnMutation,
    ILoginWithWebAuthnMutationVariables
  >(LogWithWebAuthnMutation);

  const loginWithWebAuthn = async ({
    webAuthnPublicKeyCredentials,
  }: ILoginWithWebAuthnMutationVariables) => {
    const result = await loginWithWebAuthnMutation({
      variables: { webAuthnPublicKeyCredentials },
      awaitRefetchQueries: true,
    });
    await client.resetStore();
    return result;
  };
  return { loginWithWebAuthn };
};

export default useLoginWithWebAuthn;
