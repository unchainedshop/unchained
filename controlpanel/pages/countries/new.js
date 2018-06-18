import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import FormNewCountry from '../../components/countries/FormNewCountry';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(props => (
  <App {...props}>
    <Container>
      <p>Sprache hinzufügen</p>
      <FormNewCountry />
    </Container>
  </App>
));
