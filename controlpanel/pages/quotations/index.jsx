import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import QuotationList from '../../components/quotations/QuotationList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ ...rest }) => (
  <App {...rest}>
    <Container>
      <h2>Quotations</h2>
      <QuotationList />
    </Container>
  </App>
));
