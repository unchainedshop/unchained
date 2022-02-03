import React from 'react';
import { withRouter } from 'next/router';
import { Container, Grid } from 'semantic-ui-react';
import App from '../../components/App';
import QuotationHeader from '../../components/quotations/QuotationHeader';
import QuotationDownloads from '../../components/quotations/QuotationDownloads';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(
  withRouter(({ router, ...rest }) => (
    <App {...rest}>
      <Container>
        <Grid columns={2} stackable>
          <Grid.Column width={16}>
            <QuotationHeader quotationId={router.query._id} />
          </Grid.Column>
          <Grid.Column>
            <QuotationDownloads quotationId={router.query._id} />
          </Grid.Column>
        </Grid>
      </Container>
    </App>
  )),
);
