import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import PaymentProviderList from '../../components/payment-providers/PaymentProviderList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(props => (
  <App {...props}>
    <Container>
      <h2>
Payments
      </h2>
      <PaymentProviderList />
    </Container>
  </App>
));
