import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/AppContainer';
import FormEditCurrency from '../../components/currencies/FormEditCurrency';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ url, ...rest }) => (
  <App url={url} {...rest}>
    <Container>
      <FormEditCurrency currencyId={url.query._id} />
    </Container>
  </App>
));
