import React from 'react';
import { withRouter } from 'next/router';
import { Container, Grid } from 'semantic-ui-react';
import App from '../../components/App';
import EnrollmentOrders from '../../components/enrollments/EnrollmentOrders';
// import EnrollmentPlan from '../../components/enrollments/EnrollmentPlan';
// import EnrollmentDelivery from '../../components/enrollments/EnrollmentDelivery';
// import EnrollmentPayment from '../../components/enrollments/EnrollmentPayment';
import EnrollmentHeader from '../../components/enrollments/EnrollmentHeader';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(
  withRouter(({ router, ...rest }) => (
    <App {...rest}>
      <Container>
        <Grid columns={2} stackable>
          <Grid.Column width={16}>
            <EnrollmentHeader enrollmentId={router.query._id} />
          </Grid.Column>
          <Grid.Column width={16}>
            <EnrollmentOrders enrollmentId={router.query._id} />
          </Grid.Column>
          {/* <Grid.Column>
            <EnrollmentPlan enrollmentId={router.query._id} />
          </Grid.Column>
          <Grid.Column>
            <EnrollmentDelivery enrollmentId={router.query._id} />
          </Grid.Column>
          <Grid.Column>
            <EnrollmentPayment enrollmentId={router.query._id} />
          </Grid.Column> */}
        </Grid>
      </Container>
    </App>
  )),
);
