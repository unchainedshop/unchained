import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../components/App';
import SystemInfo from '../components/SystemInfo';
import connectApollo from '../lib/connectApollo';
import '../public/css/all.css';

export default connectApollo(({ ...rest }) => (
  <App {...rest}>
    <Container>
      <SystemInfo />
    </Container>
  </App>
));
