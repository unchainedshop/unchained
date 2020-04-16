import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import WorkList from '../../components/work/WorkList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ ...rest }) => (
  <App {...rest}>
    <Container>
      <h2>Work</h2>
      <WorkList />
    </Container>
  </App>
));
