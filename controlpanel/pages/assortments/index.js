import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import AssortmentList from '../../components/assortments/AssortmentList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(props => (
  <App {...props}>
    <Container>
      <h2>Assortments</h2>
      <AssortmentList />
    </Container>
  </App>
));
