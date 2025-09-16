import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ICreateUserMutation,
  ICreateUserMutationVariables,
} from '../../../gql/types';

const CreateUserMutation = gql`
  mutation CreateUser(
    $username: String
    $email: String
    $plainPassword: String
    $profile: UserProfileInput
    $webAuthnPublicKeyCredentials: JSON
  ) {
    createUser(
      username: $username
      email: $email
      password: $plainPassword
      profile: $profile
      webAuthnPublicKeyCredentials: $webAuthnPublicKeyCredentials
    ) {
      _id
      tokenExpires
    }
  }
`;

const useCreateUser = () => {
  const [createUserMutation, { data, error, loading, client }] = useMutation<
    ICreateUserMutation,
    ICreateUserMutationVariables
  >(CreateUserMutation);

  const createUser = async ({
    username,
    email,
    plainPassword,
    profile,
    webAuthnPublicKeyCredentials,
  }: ICreateUserMutationVariables) => {
    const variables = {
      username: null,
      email: null,
      profile,
      plainPassword: null,
      webAuthnPublicKeyCredentials,
    };
    if (email) {
      variables.email = email;
    }
    if (username) {
      variables.username = username;
    }
    variables.plainPassword = plainPassword;
    const result = await createUserMutation({
      variables,
      refetchQueries: ['Users'],
    });

    await client.resetStore();
    return result;
  };
  const newUser = data?.createUser;

  return {
    createUser,
    newUser,
    error,
    loading,
  };
};

export default useCreateUser;
