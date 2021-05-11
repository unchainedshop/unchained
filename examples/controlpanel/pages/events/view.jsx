import React from 'react';
import { withRouter } from 'next/router';
import { Container, Grid } from 'semantic-ui-react';
import App from '../../components/App';
import EventHeader from '../../components/event/EventHeader';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(
  withRouter(({ router, ...rest }) => (
    <App {...rest}>
      <Container>
        <Grid columns={2} stackable>
          <Grid.Column width={16}>
            <EventHeader eventId={router.query._id} />
          </Grid.Column>
        </Grid>
      </Container>
    </App>
  ))
);
