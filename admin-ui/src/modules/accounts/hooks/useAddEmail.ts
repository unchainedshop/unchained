import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IAddEmailMutation,
  IAddEmailMutationVariables,
} from '../../../gql/types';

const AddEmailMutation = gql`
  mutation AddEmail($email: String!, $userId: ID) {
    addEmail(email: $email, userId: $userId) {
      _id
    }
  }
`;

const useAddEmail = () => {
  const [addEmailMutation] = useMutation<
    IAddEmailMutation,
    IAddEmailMutationVariables
  >(AddEmailMutation);

  const addEmail = async ({ email, userId }: IAddEmailMutationVariables) => {
    return addEmailMutation({
      variables: { email, userId },
      refetchQueries: ['UserPermissions', 'User', 'CurrentUser'],
    });
  };

  return {
    addEmail,
  };
};

export default useAddEmail;
