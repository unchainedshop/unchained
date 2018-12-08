import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import FormNewAssortment from '../../components/assortments/FormNewAssortment';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ onSuccess, ...rest }) => (
  <App {...rest}>
    <Container>
      <p>
        New assortment
      </p>
      <FormNewAssortment />
    </Container>
  </App>
));
