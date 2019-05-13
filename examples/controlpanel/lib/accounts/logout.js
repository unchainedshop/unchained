import gql from 'graphql-tag';
import { getLoginToken, resetStore } from './store';

export default async function(apollo) {
  const token = await getLoginToken();
  await resetStore();

  if (!token) return;

  apollo.mutate({
    mutation: gql`
      mutation logout($token: String) {
        logout(token: $token) {
          success
        }
      }
    `,
    variables: {
      token
    }
  });
}
