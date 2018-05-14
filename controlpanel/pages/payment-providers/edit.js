import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/AppContainer';
import FormEditPaymentProvider from '../../components/payment-providers/FormEditPaymentProvider';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ url, ...rest }) => (
  <App url={url} {...rest}>
    <Container>
      <FormEditPaymentProvider paymentProviderId={url.query._id} />
    </Container>
  </App>
));
