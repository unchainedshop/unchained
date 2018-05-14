import React from 'react';
import { toast } from 'react-toastify';
import Router from 'next/router';
import { Container } from 'semantic-ui-react';
import App from '../../components/AppContainer';
import FormProfile from '../../components/users/FormProfileContainer';
import connectApollo from '../../lib/connectApollo';

const redirect = () => {
  toast('Profile updated', { type: 'success' });
  Router.push({ pathname: '/users/profile' });
};

export default connectApollo(({ url, ...rest }) => (
  <App url={url} {...rest}>
    <Container>
      <FormProfile onSubmitSuccess={redirect} />
    </Container>
  </App>
));
