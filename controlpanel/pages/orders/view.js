import React from 'react';
import { Container, Grid } from 'semantic-ui-react';
import App from '../../components/AppContainer';
import OrderDownloads from '../../components/orders/OrderDownloads';
import OrderPositionList from '../../components/orders/OrderPositionList';
import OrderCalculation from '../../components/orders/OrderCalculation';
import OrderDelivery from '../../components/orders/OrderDelivery';
import OrderPayment from '../../components/orders/OrderPayment';
import OrderHeader from '../../components/orders/OrderHeader';
import OrderLogList from '../../components/orders/OrderLogList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ url, ...rest }) => (
  <App url={url} {...rest}>
    <Container>
      <Grid columns={2} stackable>
        <Grid.Column width={16}>
          <OrderHeader orderId={url.query._id} />
        </Grid.Column>
        <Grid.Column>
          <OrderDownloads orderId={url.query._id} />
        </Grid.Column>
        <Grid.Column>
          <OrderPositionList orderId={url.query._id} />
        </Grid.Column>
        <Grid.Column>
          <OrderCalculation orderId={url.query._id} />
        </Grid.Column>
        <Grid.Column>
          <OrderDelivery orderId={url.query._id} />
        </Grid.Column>
        <Grid.Column>
          <OrderPayment orderId={url.query._id} />
        </Grid.Column>
        <Grid.Column width={16}>
          <OrderLogList orderId={url.query._id} />
        </Grid.Column>
      </Grid>
    </Container>
  </App>
));
