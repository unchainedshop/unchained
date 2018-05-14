import React from 'react';
import { createSink } from 'recompose';
import { withApollo } from 'react-apollo';
import Router from 'next/router';
import { Message, Container } from 'semantic-ui-react';
import { verifyEmail } from '../lib/accounts';
import App from '../components/AppContainer';
import connectApollo from '../lib/connectApollo';

let verificationStarted = false;

const Verifier = withApollo(createSink(async (
  { client, url: { query: { expired, token } } },
) => {
  if (token && !expired && !verificationStarted) {
    try {
      verificationStarted = true;
      await verifyEmail({ token }, client);
      Router.push('/');
    } catch (e) {
      Router.push('/verify-email?expired=1');
    }
  }
}));


export default connectApollo(({ ...rest }) => (
  <App {...rest} noRedirect>
    <Container>
      {process.browser && (
        <Verifier {...rest} />
      )}
      {rest.url.query.expired ? (
        <Message negative>
          <Message.Header>Token expired</Message.Header>
          <p>Dieser Verifizierungstoken ist nicht mehr gültig,
          melde dich an und lass dir einen neuen zusenden
          </p>
        </Message>
      ) : (
        <Message>
          <Message.Header>Verifizierung...</Message.Header>
          <p>Du wirst gleich weitergeleitet...</p>
        </Message>
      )}
    </Container>
  </App>
));
