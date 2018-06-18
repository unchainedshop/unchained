import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import FormNewDeliveryProvider from '../../components/delivery-providers/FormNewDeliveryProvider';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(props => (
  <App {...props}>
    <Container>
      <p>New Delivery</p>
      <FormNewDeliveryProvider />
    </Container>
  </App>
));
