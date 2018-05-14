import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/AppContainer';
import FormNewUser from '../../components/users/FormNewUser';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(props => (
  <App {...props}>
    <Container>
      <p>New User</p>
      <FormNewUser />
    </Container>
  </App>
));
