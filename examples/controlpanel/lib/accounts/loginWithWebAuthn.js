import gql from 'graphql-tag';
import { storeLoginToken } from './store';

export default async function loginWithWebAuthn(webAuthnPublicKeyCredentials, apollo) {
  const result = await apollo.mutate({
    mutation: gql`
      mutation login($webAuthnPublicKeyCredentials: JSON!) {
        loginWithWebAuthn(webAuthnPublicKeyCredentials: $webAuthnPublicKeyCredentials) {
          id
          token
          tokenExpires
        }
      }
    `,
    variables: { webAuthnPublicKeyCredentials },
  });

  const { id, token, tokenExpires } = result.data.loginWithWebAuthn;
  await storeLoginToken(id, token, new Date(tokenExpires));
  return id;
}
