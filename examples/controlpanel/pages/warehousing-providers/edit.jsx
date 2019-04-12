import React from 'react';
import { withRouter } from 'next/router';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import FormEditWarehousingProvider from '../../components/warehousing-providers/FormEditWarehousingProvider';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(
  withRouter(({ router, ...rest }) => (
    <App {...rest}>
      <Container>
        <FormEditWarehousingProvider warehousingProviderId={router.query._id} />
      </Container>
    </App>
  ))
);
