import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IResetPasswordMutation,
  IResetPasswordMutationVariables,
} from '../../../gql/types';

const ResetPasswordMutation = gql`
  mutation ResetPassword($newPlainPassword: String!, $token: String!) {
    resetPassword(newPassword: $newPlainPassword, token: $token) {
      _id
      tokenExpires
    }
  }
`;

const useResetPassword = () => {
  const [resetPasswordMutation, { client }] = useMutation<
    IResetPasswordMutation,
    IResetPasswordMutationVariables
  >(ResetPasswordMutation);

  const resetPassword = async ({
    newPlainPassword,
    token,
  }: IResetPasswordMutationVariables) => {
    const variables = {
      token,
      newPlainPassword: null,
    };
    variables.newPlainPassword = newPlainPassword;

    const result = await resetPasswordMutation({
      variables,
      awaitRefetchQueries: true,
    });
    await client.resetStore();
    return result;
  };

  return {
    resetPassword,
  };
};

export default useResetPassword;
