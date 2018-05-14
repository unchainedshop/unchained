import React from 'react';
import { Segment, Container } from 'semantic-ui-react';
import App from '../components/AppContainer';
import FormResetPassword from '../components/account/FormResetPassword';
import connectApollo from '../lib/connectApollo';

export default connectApollo(({ url, ...rest }) => (
  <App url={url} {...rest} allowAnonymousAccess>
    <Container>
      <Segment>
        <h3 className="title">Reset password</h3>
        <FormResetPassword url={url} />
      </Segment>
    </Container>
  </App>
));
