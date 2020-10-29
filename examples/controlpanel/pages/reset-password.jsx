import React from 'react';
import { Segment, Container } from 'semantic-ui-react';
import App from '../components/App';
import FormResetPassword from '../components/account/FormResetPassword';
import connectApollo from '../lib/connectApollo';

export default connectApollo((props) => (
  <App {...props} allowAnonymousAccess>
    <Container>
      <Segment>
        <h3 className="title">Reset password</h3>
        <FormResetPassword />
      </Segment>
    </Container>
  </App>
));
