import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/AppContainer';
import FormEditLanguage from '../../components/languages/FormEditLanguage';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ url, ...rest }) => (
  <App url={url} {...rest}>
    <Container>
      <FormEditLanguage languageId={url.query._id} />
    </Container>
  </App>
));
