import React from 'react';
import { Grid, Container, Header } from 'semantic-ui-react';
import App from '../../components/AppContainer';
import FormEditProductTexts from '../../components/products/FormEditProductTexts';
import FormEditProductCommerce from '../../components/products/FormEditProductCommerce';
import FormEditProductSupply from '../../components/products/FormEditProductSupply';
import FormEditProductWarehousing from '../../components/products/FormEditProductWarehousing';
import ProductVariationList from '../../components/products/ProductVariationList';
import ProductVariationAssignmentList from '../../components/products/ProductVariationAssignmentList'; // eslint-disable-line
import ProductMediaList from '../../components/products/ProductMediaList';
import ProductHeader from '../../components/products/ProductHeader';
import ProductMenu from '../../components/products/ProductMenu';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(({ changeTab, url, ...rest }) => (
  <App url={url} {...rest}>
    <Container>
      <Grid>
        <Grid.Row>
          <Grid.Column stretched>
            <ProductHeader productId={url.query._id} />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={3}>
            <ProductMenu url={url} productId={url.query._id} />
          </Grid.Column>
          <Grid.Column stretched width={12}>
            {(!url.query.tab || url.query.tab === 'ProductTranslation') && (
              <div>
                <Header as="h3">General Texts</Header>
                <FormEditProductTexts productId={url.query._id} />
              </div>
            )}
            {url.query.tab === 'ProductVisualization' && (
              <div>
                <Header as="h3">Catalog Visualization</Header>
                <ProductMediaList productId={url.query._id} />
              </div>
            )}
            {url.query.tab === 'ProductCommerce' && (
              <div>
                <Header as="h3">Pricing</Header>
                <FormEditProductCommerce productId={url.query._id} />
              </div>
            )}
            {url.query.tab === 'ProductSupply' && (
              <div>
                <Header as="h3">Delivery Information</Header>
                <FormEditProductSupply productId={url.query._id} />
              </div>
            )}
            {url.query.tab === 'ProductWarehousing' && (
              <div>
                <Header as="h3">Warehousing Information</Header>
                <FormEditProductWarehousing productId={url.query._id} />
              </div>
            )}
            {url.query.tab === 'ProductProxy' && (
              <div>
                <Header as="h3">Metrics</Header>
                <ProductVariationList productId={url.query._id} />
                <Header as="h3">Product Assignment</Header>
                <ProductVariationAssignmentList productId={url.query._id} />
              </div>
            )}
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Container>
  </App>
));
