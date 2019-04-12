import React from 'react';
import { withRouter } from 'next/router';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import FormEditCountry from '../../components/countries/FormEditCountry';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(
  withRouter(({ router, ...rest }) => (
    <App {...rest}>
      <Container>
        <FormEditCountry countryId={router.query._id} />
      </Container>
    </App>
  ))
);
