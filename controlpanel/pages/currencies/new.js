import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/AppContainer';
import FormNewCurrency from '../../components/currencies/FormNewCurrency';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ onSuccess, ...rest }) => (
  <App {...rest}>
    <Container>
      <p>Währung hinzufügen</p>
      <FormNewCurrency />
    </Container>
  </App>
));
