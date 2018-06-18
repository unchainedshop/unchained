import React from 'react';
import { withRouter } from 'next/router';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import FormEditAssortment from '../../components/assortments/FormEditAssortment';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(withRouter(({ router, ...rest }) => (
  <App {...rest}>
    <Container>
      <FormEditAssortment assortmentId={router.query._id} />
    </Container>
  </App>
)));
