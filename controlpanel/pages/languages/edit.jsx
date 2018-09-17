import React from 'react';
import { withRouter } from 'next/router';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import FormEditLanguage from '../../components/languages/FormEditLanguage';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(withRouter(({ router, ...rest }) => (
  <App {...rest}>
    <Container>
      <FormEditLanguage languageId={router.query._id} />
    </Container>
  </App>
)));
