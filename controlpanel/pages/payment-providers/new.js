import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/AppContainer';
import FormNewPaymentProvider from '../../components/payment-providers/FormNewPaymentProvider';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(props => (
  <App {...props}>
    <Container>
      <p>New Payment</p>
      <FormNewPaymentProvider />
    </Container>
  </App>
));
