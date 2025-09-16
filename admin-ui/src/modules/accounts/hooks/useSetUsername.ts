import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ISetUsernameMutation,
  ISetUsernameMutationVariables,
} from '../../../gql/types';
import UserFragment from '../fragment/UserFragment';

const SetUserNameMutation = gql`
  mutation SetUsername($username: String!, $userId: ID!) {
    setUsername(username: $username, userId: $userId) {
      ...UserFragment
    }
  }
  ${UserFragment}
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
      refetchQueries: ['User'],
    });
  };

  return {
    setUserName,
  };
};

export default useSetUserName;
