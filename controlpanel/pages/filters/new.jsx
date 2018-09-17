import React from 'react';
import { withRouter } from 'next/router';
import { compose, withHandlers } from 'recompose';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import FormNewFilter from '../../components/filters/FormNewFilter';
import connectApollo from '../../lib/connectApollo';

const New = ({ onSuccess, ...rest }) => (
  <App {...rest}>
    <Container>
      <p>
        New filter
      </p>
      <FormNewFilter onSuccess={onSuccess} />
    </Container>
  </App>
);

export default connectApollo(compose(
  withRouter,
  withHandlers({
    onSuccess: ({ router }) => (filterId) => {
      router.push({ pathname: '/filters/edit', query: { _id: filterId } });
    },
  }),
)(New));
