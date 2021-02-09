import React from 'react';
import { withRouter } from 'next/router';
import { Container, Grid } from 'semantic-ui-react';
import App from '../../components/App';
import WorkHeader from '../../components/work/WorkHeader';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(
  withRouter(({ router, ...rest }) => (
    <App {...rest}>
      <Container>
        <Grid columns={2} stackable>
          <Grid.Column width={16}>
            <WorkHeader workId={router.query._id} />
          </Grid.Column>
        </Grid>
      </Container>
    </App>
  ))
);
