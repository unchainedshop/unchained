import React from 'react';
import { withRouter } from 'next/router';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import FormEditPaymentProvider from '../../components/payment-providers/FormEditPaymentProvider';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(
  withRouter(({ router, ...rest }) => (
    <App {...rest}>
      <Container>
        <FormEditPaymentProvider paymentProviderId={router.query._id} />
      </Container>
    </App>
  )),
);
