import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import LogList from '../../components/LogList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ ...rest }) => (
  <App {...rest}>
    <Container>
      <h2>
Logs
      </h2>
      <LogList basic compact />
    </Container>
  </App>
));
