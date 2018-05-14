import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/AppContainer';
import FormEditWarehousingProvider from '../../components/warehousing-providers/FormEditWarehousingProvider';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ url, ...rest }) => (
  <App url={url} {...rest}>
    <Container>
      <FormEditWarehousingProvider warehousingProviderId={url.query._id} />
    </Container>
  </App>
));
