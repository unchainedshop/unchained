import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ILoginWithPasswordMutation,
  ILoginWithPasswordMutationVariables,
} from '../../../gql/types';
import isEmail from '../../common/utils/isEmail';

const LogInWithPasswordMutation = gql`
  mutation LoginWithPassword(
    $username: String
    $email: String
    $password: String!
  ) {
    loginWithPassword(username: $username, email: $email, password: $password) {
      _id
      tokenExpires
      user {
        _id
        allowedActions
        roles
      }
    }
  }
`;

const useLoginWithPassword = () => {
  const [logInWithPasswordMutation, { client }] = useMutation<
    ILoginWithPasswordMutation,
    ILoginWithPasswordMutationVariables
  >(LogInWithPasswordMutation, {
    errorPolicy: 'all',
  });

  const logInWithPassword = async ({ usernameOrEmail, password }) => {
    const variables = {
      username: null,
      email: null,
      password: null,
    };

    if (isEmail(usernameOrEmail)) {
      const normalizedEmail = usernameOrEmail?.trim();
      variables.email = normalizedEmail;
    } else {
      variables.username = usernameOrEmail;
    }

    variables.password = password;
    const result = await logInWithPasswordMutation({
      variables,
      awaitRefetchQueries: true,
    });
    if (result?.data?.loginWithPassword) {
      await client.resetStore();
    }
    return result;
  };

  return {
    logInWithPassword,
  };
};

export default useLoginWithPassword;
