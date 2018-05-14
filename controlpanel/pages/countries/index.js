import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/AppContainer';
import CountryList from '../../components/countries/CountryList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(props => (
  <App {...props}>
    <Container>
      <h2>Länder</h2>
      <CountryList />
    </Container>
  </App>
));
