import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import FormNewCurrency from '../../components/currencies/FormNewCurrency';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ onSuccess, ...rest }) => (
  <App {...rest}>
    <Container>
      <p>
New currency
      </p>
      <FormNewCurrency />
    </Container>
  </App>
));
