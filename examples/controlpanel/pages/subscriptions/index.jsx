import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import SubscriptionList from '../../components/subscriptions/SubscriptionList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ ...rest }) => (
  <App {...rest}>
    <Container>
      <h2>Subscriptions</h2>
      <SubscriptionList />
    </Container>
  </App>
));
