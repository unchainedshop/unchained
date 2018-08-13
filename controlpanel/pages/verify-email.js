import React from 'react';
import { createSink } from 'recompose';
import { withApollo } from 'react-apollo';
import { withRouter } from 'next/router';
import { Message, Container } from 'semantic-ui-react';
import { verifyEmail } from '../lib/accounts';
import App from '../components/App';
import connectApollo from '../lib/connectApollo';

let verificationStarted = false;

const Verifier = withApollo(createSink(async (
  { router, client }) => {
  const { query: { expired, token } } = router;
  if (token && !expired && !verificationStarted) {
    try {
      verificationStarted = true;
      await verifyEmail({ token }, client);
      router.push('/');
    } catch (e) {
      router.push('/verify-email?expired=1');
    }
  }
}));


export default connectApollo(withRouter(({ router, ...rest }) => (
  <App {...rest}>
    <Container>
      {process.browser && (
        <Verifier router={router} {...rest} />
      )}
      {router.query.expired ? (
        <Message negative>
          <Message.Header>
Token expired
          </Message.Header>
          <p>
Dieser Verifizierungstoken ist nicht mehr gültig,
          melde dich an und lass dir einen neuen zusenden
          </p>
        </Message>
      ) : (
        <Message>
          <Message.Header>
Verifizierung...
          </Message.Header>
          <p>
Du wirst gleich weitergeleitet...
          </p>
        </Message>
      )}
    </Container>
  </App>
)));
