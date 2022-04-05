import React from 'react';
import { withRouter } from 'next/router';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import FormEditCurrency from '../../components/currencies/FormEditCurrency';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(
  withRouter(({ router, ...rest }) => (
    <App {...rest}>
      <Container>
        <FormEditCurrency currencyId={router.query._id} />
      </Container>
    </App>
  )),
);
