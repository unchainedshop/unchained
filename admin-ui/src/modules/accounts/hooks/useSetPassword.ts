import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ISetPasswordMutation,
  ISetPasswordMutationVariables,
} from '../../../gql/types';

const SetPasswordMutation = gql`
  mutation SetPassword($newPlainPassword: String!, $userId: ID!) {
    setPassword(newPassword: $newPlainPassword, userId: $userId) {
      _id
    }
  }
`;

const useSetPassword = () => {
  const [setPasswordMutation] = useMutation<
    ISetPasswordMutation,
    ISetPasswordMutationVariables
  >(SetPasswordMutation);

  const setPassword = async ({
    newPlainPassword = undefined,
    userId,
  }: ISetPasswordMutationVariables) => {
    const variables = { newPlainPassword, userId };
    return setPasswordMutation({
      variables,
      refetchQueries: ['UserPermissions', 'User', 'CurrentUser'],
    });
  };

  return {
    setPassword,
  };
};

export default useSetPassword;
