import React from 'react';
import { withRouter } from 'next/router';
import { Container, Grid } from 'semantic-ui-react';
import App from '../../components/App';
import SubscriptionOrders from '../../components/subscriptions/SubscriptionOrders';
// import SubscriptionPlan from '../../components/subscriptions/SubscriptionPlan';
// import SubscriptionDelivery from '../../components/subscriptions/SubscriptionDelivery';
// import SubscriptionPayment from '../../components/subscriptions/SubscriptionPayment';
import SubscriptionHeader from '../../components/subscriptions/SubscriptionHeader';
import SubscriptionLogList from '../../components/subscriptions/SubscriptionLogList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(
  withRouter(({ router, ...rest }) => (
    <App {...rest}>
      <Container>
        <Grid columns={2} stackable>
          <Grid.Column width={16}>
            <SubscriptionHeader subscriptionId={router.query._id} />
          </Grid.Column>
          <Grid.Column width={16}>
            <SubscriptionOrders subscriptionId={router.query._id} />
          </Grid.Column>
          {/* <Grid.Column>
            <SubscriptionPlan subscriptionId={router.query._id} />
          </Grid.Column>
          <Grid.Column>
            <SubscriptionDelivery subscriptionId={router.query._id} />
          </Grid.Column>
          <Grid.Column>
            <SubscriptionPayment subscriptionId={router.query._id} />
          </Grid.Column> */}
          <Grid.Column width={16}>
            <SubscriptionLogList subscriptionId={router.query._id} />
          </Grid.Column>
        </Grid>
      </Container>
    </App>
  ))
);
