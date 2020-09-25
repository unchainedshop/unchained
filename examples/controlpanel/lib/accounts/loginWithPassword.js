import gql from 'graphql-tag';
import hashPassword from './hashPassword';
import { storeLoginToken } from './store';

export default async function loginWithPassword(
  { username, email, password, disableHashing = false },
  apollo
) {
  const variables = { username, email };
  if (disableHashing) {
    variables.plainPassword = password;
  } else {
    variables.password = hashPassword(password);
  }
  const result = await apollo.mutate({
    mutation: gql`
      mutation login(
        $username: String
        $email: String
        $password: HashedPasswordInput
        $plainPassword: String
      ) {
        loginWithPassword(
          username: $username
          email: $email
          password: $password
          plainPassword: $plainPassword
        ) {
          id
          token
          tokenExpires
        }
      }
    `,
    variables,
  });

  const { id, token, tokenExpires } = result.data.loginWithPassword;
  await storeLoginToken(id, token, new Date(tokenExpires));
  return id;
}
