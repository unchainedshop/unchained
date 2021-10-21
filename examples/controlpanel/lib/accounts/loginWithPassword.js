import gql from 'graphql-tag';
import hashPassword from './hashPassword';
import { storeLoginToken } from './store';

export default async function loginWithPassword(
  { username, email, password, totpCode, disableHashing = false },
  apollo
) {
  const variables = { username, email, totpCode };
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
        $totpCode: String
      ) {
        loginWithPassword(
          username: $username
          email: $email
          password: $password
          plainPassword: $plainPassword
          totpCode: $totpCode
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
