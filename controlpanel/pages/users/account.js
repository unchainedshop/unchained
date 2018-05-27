import React from 'react';
import { toast } from 'react-toastify';
import Router from 'next/router';
import { Segment, Container } from 'semantic-ui-react';
import App from '../../components/AppContainer';
import FormChangePassword from '../../components/account/FormChangePassword';
import FormChangeEmail from '../../components/account/FormChangeEmailContainer';
import connectApollo from '../../lib/connectApollo';

const redirect = () => {
  toast('Account updated', { type: toast.TYPE.SUCCESS });
  Router.push({ pathname: '/users/account' });
};

export default connectApollo(({ url, ...rest }) => (
  <App url={url} {...rest}>
    <Container>
      <Segment>
        <h3 className="title">Change password</h3>
        <FormChangePassword onSubmitSuccess={redirect} />
      </Segment>
      <Segment>
        <h3 className="title">Change E-Mail address</h3>
        <FormChangeEmail onSubmitSuccess={redirect} />
      </Segment>
    </Container>
  </App>
));
