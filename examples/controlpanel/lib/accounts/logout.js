import gql from 'graphql-tag';
import { getLoginToken, resetStore } from './store';

export default async function logout(apollo) {
  const token = await getLoginToken();

  if (!token) return;

  await apollo.mutate({
    mutation: gql`
      mutation logout($token: String) {
        logout(token: $token) {
          success
        }
      }
    `,
    variables: {
      token,
    },
  });
  await resetStore();
}
