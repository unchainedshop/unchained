import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveEmailMutation,
  IRemoveEmailMutationVariables,
} from '../../../gql/types';
import UserFragment from '../fragment/UserFragment';

const RemoveEmailMutation = gql`
  mutation RemoveEmail($email: String!, $userId: ID) {
    removeEmail(email: $email, userId: $userId) {
      ...UserFragment
    }
  }
  ${UserFragment}
`;

const useRemoveEmail = () => {
  const [removeEmailMutation] = useMutation<
    IRemoveEmailMutation,
    IRemoveEmailMutationVariables
  >(RemoveEmailMutation);

  const removeEmail = async ({
    email,
    userId,
  }: IRemoveEmailMutationVariables) => {
    return removeEmailMutation({
      variables: {
        email,
        userId,
      },
    });
  };

  return {
    removeEmail,
  };
};

export default useRemoveEmail;
