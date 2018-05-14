import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/AppContainer';
import FormEditDeliveryProvider from '../../components/delivery-providers/FormEditDeliveryProvider';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ url, ...rest }) => (
  <App url={url} {...rest}>
    <Container>
      <FormEditDeliveryProvider deliveryProviderId={url.query._id} />
    </Container>
  </App>
));
