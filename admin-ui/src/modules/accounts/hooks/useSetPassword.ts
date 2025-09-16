import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ISetPasswordMutation,
  ISetPasswordMutationVariables,
} from '../../../gql/types';
import UserFragment from '../fragment/UserFragment';

const SetPasswordMutation = gql`
  mutation SetPassword($newPlainPassword: String!, $userId: ID!) {
    setPassword(newPassword: $newPlainPassword, userId: $userId) {
      ...UserFragment
    }
  }
  ${UserFragment}
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
    return setPasswordMutation({ variables });
  };

  return {
    setPassword,
  };
};

export default useSetPassword;
