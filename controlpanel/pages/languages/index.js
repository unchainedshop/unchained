import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import LanguageList from '../../components/languages/LanguageList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ ...rest }) => (
  <App {...rest}>
    <Container>
      <h2>Languages</h2>
      <LanguageList />
    </Container>
  </App>
));
