import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveEmailMutation,
  IRemoveEmailMutationVariables,
} from '../../../gql/types';

const RemoveEmailMutation = gql`
  mutation RemoveEmail($email: String!, $userId: ID) {
    removeEmail(email: $email, userId: $userId) {
      _id
    }
  }
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
      refetchQueries: ['UserPermissions', 'User', 'CurrentUser'],
    });
  };

  return {
    removeEmail,
  };
};

export default useRemoveEmail;
