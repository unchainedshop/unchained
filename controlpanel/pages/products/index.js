import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import ProductList from '../../components/products/ProductList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(props => (
  <App {...props}>
    <Container>
      <h2>Produkte</h2>
      <ProductList />
    </Container>
  </App>
));
