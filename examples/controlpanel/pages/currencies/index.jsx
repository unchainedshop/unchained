import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import CurrencyList from '../../components/currencies/CurrencyList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo((props) => (
  <App {...props}>
    <Container>
      <h2>Currencies</h2>
      <CurrencyList />
    </Container>
  </App>
));
