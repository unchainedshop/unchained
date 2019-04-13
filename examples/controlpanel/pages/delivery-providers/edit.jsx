import React from 'react';
import { withRouter } from 'next/router';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import FormEditDeliveryProvider from '../../components/delivery-providers/FormEditDeliveryProvider';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(
  withRouter(({ router, ...rest }) => (
    <App {...rest}>
      <Container>
        <FormEditDeliveryProvider deliveryProviderId={router.query._id} />
      </Container>
    </App>
  ))
);
