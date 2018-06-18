import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import WarehousingProviderList from '../../components/warehousing-providers/WarehousingProviderList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(props => (
  <App {...props}>
    <Container>
      <h2>Warehousings</h2>
      <WarehousingProviderList />
    </Container>
  </App>
));
