import React from 'react';
import { withRouter } from 'next/router';
import { Grid, Container, Header } from 'semantic-ui-react';
import App from '../../components/App';
import FormEditProductTexts from '../../components/products/FormEditProductTexts';
import FormEditProductCommerce from '../../components/products/FormEditProductCommerce';
import FormEditProductSupply from '../../components/products/FormEditProductSupply';
import FormEditProductWarehousing from '../../components/products/FormEditProductWarehousing';
import FormEditProductPlan from '../../components/products/FormEditProductPlan';
import ProductVariationList from '../../components/products/ProductVariationList';
import ProductVariationAssignmentList from '../../components/products/ProductVariationAssignmentList';
import ProductMediaList from '../../components/products/ProductMediaList';
import ProductBundleItemList from '../../components/products/ProductBundleItemList';
import ProductHeader from '../../components/products/ProductHeader';
import ProductMenu from '../../components/products/ProductMenu';
import connectApollo from '../../lib/connectApollo';
import ProductMediaListMinio from '../../components/products/ProductMediaListMinio';

export default connectApollo(
  withRouter(({ changeTab, router, ...rest }) => (
    <App {...rest}>
      <Container>
        <Grid>
          <Grid.Row>
            <Grid.Column stretched>
              <ProductHeader productId={router.query._id} />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={3}>
              <ProductMenu router={router} productId={router.query._id} />
            </Grid.Column>
            <Grid.Column stretched width={12}>
              {(!router.query.tab ||
                router.query.tab === 'ProductTranslation') && (
                <div>
                  <Header as="h3">General Texts</Header>
                  <FormEditProductTexts productId={router.query._id} />
                </div>
              )}
              {router.query.tab === 'ProductVisualization' && (
                <div>
                  <Header as="h3">Catalog Visualization</Header>
                  <ProductMediaListMinio productId={router.query._id} />
                </div>
              )}
              {router.query.tab === 'ProductCommerce' && (
                <div>
                  <Header as="h3">Pricing</Header>
                  <FormEditProductCommerce productId={router.query._id} />
                </div>
              )}
              {router.query.tab === 'ProductSupply' && (
                <div>
                  <Header as="h3">Delivery Information</Header>
                  <FormEditProductSupply productId={router.query._id} />
                </div>
              )}
              {router.query.tab === 'ProductWarehousing' && (
                <div>
                  <Header as="h3">Warehousing Information</Header>
                  <FormEditProductWarehousing productId={router.query._id} />
                </div>
              )}
              {router.query.tab === 'ProductProxy' && (
                <div>
                  <Header as="h3">Metrics</Header>
                  <ProductVariationList productId={router.query._id} />
                  <Header as="h3">Product Assignment</Header>
                  <ProductVariationAssignmentList
                    productId={router.query._id}
                  />
                </div>
              )}
              {router.query.tab === 'ProductBundleItems' && (
                <div>
                  <Header as="h3">Bundle Items</Header>
                  <ProductBundleItemList productId={router.query._id} />
                </div>
              )}
              {router.query.tab === 'ProductPlan' && (
                <div>
                  <Header as="h3">Plan Configuration</Header>
                  <FormEditProductPlan productId={router.query._id} />
                </div>
              )}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
    </App>
  ))
);
