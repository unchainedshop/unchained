import React from 'react';
import Link from 'next/link';
import { Grid, Segment, Button, Container } from 'semantic-ui-react';
import App from '../components/AppContainer';
import FormSignUp from '../components/account/FormSignUpContainer';
import connectApollo from '../lib/connectApollo';

export default connectApollo(({ ...rest }) => (
  <App {...rest} allowAnonymousAccess>
    <Container>
      <Segment>
        <h3 className="title">Sign up</h3>
        <FormSignUp />
      </Segment>
      <Segment>
        <Grid stackable padded columns={2}>
          <Grid.Column>
            <Segment textAlign="center" basic size="mini">
              <Link prefetch href="/sign-in">
                <Button as="a" href="/sign-in" primary basic fluid>
                Already got a user?
                </Button>
              </Link>
            </Segment>
          </Grid.Column>
        </Grid>
      </Segment>
    </Container>
  </App>
));
