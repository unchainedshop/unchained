import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ILoginWithLoginCodeMutation,
  ILoginWithLoginCodeMutationVariables,
} from '../../../gql/types';

const LoginWithLoginCodeMutation = gql`
  mutation LoginWithLoginCode($email: String, $code: String, $token: String) {
    loginWithLoginCode(email: $email, code: $code, token: $token) {
      _id
      tokenExpires
      user {
        _id
        allowedActions
        roles
      }
    }
  }
`;

const useLoginWithLoginCode = () => {
  const [loginWithLoginCodeMutation, { client }] = useMutation<
    ILoginWithLoginCodeMutation,
    ILoginWithLoginCodeMutationVariables
  >(LoginWithLoginCodeMutation, {
    errorPolicy: 'all',
  });

  const loginWithLoginCode = async (
    variables: ILoginWithLoginCodeMutationVariables,
  ) => {
    const result = await loginWithLoginCodeMutation({ variables });
    if (result?.data?.loginWithLoginCode) {
      await client.resetStore();
    }
    return result;
  };

  return {
    loginWithLoginCode,
  };
};

export default useLoginWithLoginCode;
