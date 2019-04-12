import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../components/App';
import CardList from '../components/CardList';
import connectApollo from '../lib/connectApollo';

export default connectApollo(({ ...rest }) => (
  <App {...rest}>
    <Container>
      <CardList />
    </Container>
  </App>
));
