import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import FormNewWarehousingProvider from '../../components/warehousing-providers/FormNewWarehousingProvider';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(props => (
  <App {...props}>
    <Container>
      <p>New Warehousing</p>
      <FormNewWarehousingProvider />
    </Container>
  </App>
));
