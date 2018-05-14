import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/AppContainer';
import FormEditCountry from '../../components/countries/FormEditCountry';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ url, ...rest }) => (
  <App url={url} {...rest}>
    <Container>
      <FormEditCountry countryId={url.query._id} />
    </Container>
  </App>
));
