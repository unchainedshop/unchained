import React from 'react';
import { toast } from 'react-toastify';
import { withRouter } from 'next/router';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import FormProfile from '../../components/users/FormProfile';
import connectApollo from '../../lib/connectApollo';

const redirect = router => () => {
  toast('Profile updated', { type: toast.TYPE.SUCCESS });
  router.push({ pathname: '/users/profile' });
};

export default connectApollo(
  withRouter(({ router, ...rest }) => (
    <App {...rest}>
      <Container>
        <FormProfile onSubmitSuccess={redirect(router)} />
      </Container>
    </App>
  ))
);
