import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/AppContainer';
import OrderList from '../../components/orders/OrderList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ ...rest }) => (
  <App {...rest}>
    <Container>
      <h2>Orders</h2>
      <OrderList />
    </Container>
  </App>
));
