import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import WorkList from '../../components/work/WorkList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ ...rest }) => (
  <App {...rest}>
    <Container>
      <h2>Next in Queue</h2>
      <WorkList
        queryOptions={{ pollInterval: 1000 }}
        limit={0}
        status={['ALLOCATED', 'NEW']}
      />

      <h2>Most Recently Finished</h2>
      <WorkList
        queryOptions={{ pollInterval: 5000 }}
        status={['FAILED', 'SUCCESS']}
      />
    </Container>
  </App>
));
