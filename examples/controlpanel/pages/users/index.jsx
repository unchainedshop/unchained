import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import UserList from '../../components/users/UserList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo((props) => (
  <App {...props}>
    <Container>
      <h1>All users</h1>
      <UserList />
    </Container>
  </App>
));
