import React from 'react';
import Link from 'next/link';
import { Grid, Segment, Button, Container } from 'semantic-ui-react';
import App from '../components/App';
import FormRecoverPassword from '../components/account/FormRecoverPassword';
import connectApollo from '../lib/connectApollo';

export default connectApollo(({ ...rest }) => (
  <App {...rest} allowAnonymousAccess>
    <Container>
      <Segment>
        <h3 className="title">Reset password</h3>
        <FormRecoverPassword />
      </Segment>
      <Segment>
        <Grid stackable padded columns={2}>
          <Grid.Column>
            <Segment textAlign="center" basic size="mini">
              <Link href="/sign-up">
                <Button as="a" href="/sign-up" primary basic fluid>
                  No user yet? Register now
                </Button>
              </Link>
            </Segment>
          </Grid.Column>
          <Grid.Column>
            <Segment textAlign="center" basic size="mini">
              <Link href="/sign-in">
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
