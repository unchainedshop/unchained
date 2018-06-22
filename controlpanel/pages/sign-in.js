import React from 'react';
import Link from 'next/link';
import {
  Grid, Segment, Button, Container,
} from 'semantic-ui-react';
import App from '../components/App';
import FormSignIn from '../components/account/FormSignIn';
import connectApollo from '../lib/connectApollo';

export default connectApollo(({ ...rest }) => (
  <App {...rest} allowAnonymousAccess>
    <Container>
      <Segment>
        <h3 className="title">
Login
        </h3>
        <FormSignIn />
      </Segment>
      <Segment>
        <Grid stackable padded columns={2}>
          <Grid.Column>
            <Segment textAlign="center" basic size="mini">
              <Link prefetch href="/sign-up">
                <Button as="a" href="/sign-up" primary basic fluid>
                No user yet? Register now
                </Button>
              </Link>
            </Segment>
          </Grid.Column>
          <Grid.Column>
            <Segment textAlign="center" basic size="mini">
              <Link href="/forgot-password">
                <Button as="a" href="/forgot-password" basic secondary fluid>
                Did you forget your password?
                </Button>
              </Link>
            </Segment>
          </Grid.Column>
        </Grid>
      </Segment>
    </Container>
  </App>
));
