import gql from 'graphql-tag';
import { getLoginToken, resetStore } from './store';

export default async function logout(apollo) {
  const token = await getLoginToken();

  try {
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
  } catch (e) {
    console.warn(e); // eslint-disable-line
  }
  await resetStore();
}
