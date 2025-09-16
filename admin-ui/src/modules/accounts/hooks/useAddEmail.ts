import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IAddEmailMutation,
  IAddEmailMutationVariables,
} from '../../../gql/types';
import UserFragment from '../fragment/UserFragment';

const AddEmailMutation = gql`
  mutation AddEmail($email: String!, $userId: ID) {
    addEmail(email: $email, userId: $userId) {
      ...UserFragment
    }
  }
  ${UserFragment}
`;

const useAddEmail = () => {
  const [addEmailMutation] = useMutation<
    IAddEmailMutation,
    IAddEmailMutationVariables
  >(AddEmailMutation);

  const addEmail = async ({ email, userId }: IAddEmailMutationVariables) => {
    return addEmailMutation({
      variables: { email, userId },
    });
  };

  return {
    addEmail,
  };
};

export default useAddEmail;
