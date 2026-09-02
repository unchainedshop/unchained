import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IEnrollUserMutation,
  IEnrollUserMutationVariables,
} from '../../../gql/types';

const EnrollUserMutation = gql`
  mutation EnrollUser(
    $email: String!
    $plainPassword: String
    $profile: UserProfileInput!
  ) {
    enrollUser(email: $email, password: $plainPassword, profile: $profile) {
      _id
    }
  }
`;

const useEnrollUser = () => {
  const [enrollUserMutation, { data, error, loading }] = useMutation<
    IEnrollUserMutation,
    IEnrollUserMutationVariables
  >(EnrollUserMutation);

  const enrollUser = async ({ email, password, profile }) => {
    const variables = {
      email,
      profile,
      plainPassword: null,
    };
    variables.plainPassword = password;
    return enrollUserMutation({
      variables,
      refetchQueries: ['Users'],
    });
  };
  const newUser = data?.enrollUser;

  return {
    enrollUser,
    newUser,
    error,
    loading,
  };
};

export default useEnrollUser;
