import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ISetUsernameMutation,
  ISetUsernameMutationVariables,
} from '../../../gql/types';

const SetUserNameMutation = gql`
  mutation SetUsername($username: String!, $userId: ID!) {
    setUsername(username: $username, userId: $userId) {
      _id
    }
  }
`;

const useSetUserName = () => {
  const [setUserNameMutation] = useMutation<
    ISetUsernameMutation,
    ISetUsernameMutationVariables
  >(SetUserNameMutation);

  const setUserName = async ({
    username,
    userId,
  }: ISetUsernameMutationVariables) => {
    return setUserNameMutation({
      variables: {
        username,
        userId,
      },
      refetchQueries: ['UserPermissions', 'User', 'CurrentUser'],
    });
  };

  return {
    setUserName,
  };
};

export default useSetUserName;
