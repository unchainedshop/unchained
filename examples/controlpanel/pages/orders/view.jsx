import React from 'react';
import { withRouter } from 'next/router';
import { Container, Grid } from 'semantic-ui-react';
import App from '../../components/App';
import OrderDownloads from '../../components/orders/OrderDownloads';
import OrderPositionList from '../../components/orders/OrderPositionList';
import OrderCalculation from '../../components/orders/OrderCalculation';
import OrderDelivery from '../../components/orders/OrderDelivery';
import OrderPayment from '../../components/orders/OrderPayment';
import OrderHeader from '../../components/orders/OrderHeader';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(
  withRouter(({ router, ...rest }) => (
    <App {...rest}>
      <Container>
        <Grid columns={2} stackable>
          <Grid.Column width={16}>
            <OrderHeader orderId={router.query._id} />
          </Grid.Column>
          <Grid.Column>
            <OrderDownloads orderId={router.query._id} />
          </Grid.Column>
          <Grid.Column>
            <OrderPositionList orderId={router.query._id} />
          </Grid.Column>
          <Grid.Column>
            <OrderCalculation orderId={router.query._id} />
          </Grid.Column>
          <Grid.Column>
            <OrderDelivery orderId={router.query._id} />
          </Grid.Column>
          <Grid.Column>
            <OrderPayment orderId={router.query._id} />
          </Grid.Column>
        </Grid>
      </Container>
    </App>
  )),
);
