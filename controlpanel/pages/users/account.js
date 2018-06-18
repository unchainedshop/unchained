import React from 'react';
import { toast } from 'react-toastify';
import { withRouter } from 'next/router';
import { Segment, Container } from 'semantic-ui-react';
import App from '../../components/App';
import FormChangePassword from '../../components/account/FormChangePassword';
import FormChangeEmail from '../../components/account/FormChangeEmail';
import connectApollo from '../../lib/connectApollo';

const redirect = router => () => {
  toast('Account updated', { type: toast.TYPE.SUCCESS });
  router.push({ pathname: '/users/account' });
};

export default connectApollo(withRouter(({ router, ...rest }) => (
  <App {...rest}>
    <Container>
      <Segment>
        <h3 className="title">Change password</h3>
        <FormChangePassword onSubmitSuccess={redirect(router)} />
      </Segment>
      <Segment>
        <h3 className="title">Change E-Mail address</h3>
        <FormChangeEmail onSubmitSuccess={redirect(router)} />
      </Segment>
    </Container>
  </App>
)));
