import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import EnrollmentList from '../../components/enrollments/EnrollmentList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ ...rest }) => (
  <App {...rest}>
    <Container>
      <h2>Enrollments</h2>
      <EnrollmentList />
    </Container>
  </App>
));
