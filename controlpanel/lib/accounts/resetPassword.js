import gql from 'graphql-tag';
import { storeLoginToken } from './store';
import hashPassword from './hashPassword';

export default async function ({ newPassword, token, disableHashing = false }, apollo) {
  const variables = {
    token,
  };
  if (disableHashing) {
    variables.newPlainPassword = newPassword;
  } else {
    variables.newPassword = hashPassword(newPassword);
  }
  const result = await apollo.mutate({
    mutation: gql`mutation resetPassword($newPassword: HashedPasswordInput, $newPlainPassword: String, $token: String!) {
      resetPassword(newPassword: $newPassword, newPlainPassword: $newPlainPassword, token: $token) {
        id
        token
        tokenExpires
      }
    }`,
    variables,
  });

  const { id, token: loginToken, tokenExpires } = result.data.resetPassword;
  await storeLoginToken(id, loginToken, new Date(tokenExpires));
  return id;
}
