import React from 'react';
import { compose, pure, mapProps } from 'recompose';
import { format } from 'date-fns';
import { Menu, Dropdown, Segment, Label, List, Grid } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import BtnPublishProduct from './BtnPublishProduct';
import BtnRemoveProduct from './BtnRemoveProduct';
import BtnUnpublishProduct from './BtnUnpublishProduct';
import FormEditProduct from './FormEditProduct';
import BreadcrumbTrail from '../BreadcrumbTrail';

const ProductHeader = ({ loading, productId, product = {} }) => [
  product && product.assortmentPaths && (
    <BreadcrumbTrail assortmentPaths={product.assortmentPaths} />
  ),
  <Menu fluid attached="top" borderless key="header-title">
    <Menu.Item header>
      Product:&nbsp;
      {product.texts && product.texts.title}
    </Menu.Item>
    <Menu.Item>
      <Label color="red" horizontal>
        {product.status}
      </Label>
    </Menu.Item>
    <Menu.Menu position="right">
      <Dropdown item icon="wrench" simple>
        <Dropdown.Menu>
          <Dropdown.Header>Options</Dropdown.Header>
          <BtnRemoveProduct
            productId={product._id}
            Component={Dropdown.Item}
            disabled={product.status !== 'DRAFT'}
          >
            Delete
          </BtnRemoveProduct>
          <BtnPublishProduct
            productId={product._id}
            Component={Dropdown.Item}
            disabled={product.status !== 'DRAFT'}
          >
            Publish
          </BtnPublishProduct>
          <BtnUnpublishProduct
            productId={product._id}
            Component={Dropdown.Item}
            disabled={product.status !== 'ACTIVE'}
          >
            Unpublish
          </BtnUnpublishProduct>
        </Dropdown.Menu>
      </Dropdown>
    </Menu.Menu>
  </Menu>,
  <Segment attached loading={loading} key="header-body">
    <Grid>
      <Grid.Row columns={2}>
        <Grid.Column width={10}>
          <List>
            <List.Item>
              <List.Icon name="cube" />
              <List.Content>Product type: {product.__typename}</List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="add to calendar" />
              <List.Content>
                Created:{' '}
                {product.created ? format(product.created, 'Pp') : 'n/a'}
              </List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="refresh" />
              <List.Content>
                Updated:{' '}
                {product.updated ? format(product.updated, 'Pp') : 'n/a'}
              </List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="eye" />
              <List.Content>
                Published:{' '}
                {product.published ? format(product.published, 'Pp') : 'n/a'}
              </List.Content>
            </List.Item>
          </List>
        </Grid.Column>
        <Grid.Column width={6}>
          <FormEditProduct productId={productId} />
        </Grid.Column>
      </Grid.Row>
    </Grid>
  </Segment>,
];

export default compose(
  graphql(gql`
    query productInfos($productId: ID) {
      product(productId: $productId) {
        _id
        status
        created
        updated
        published
        tags
        texts {
          _id
          title
        }
        assortmentPaths {
          links {
            link {
              tags
            }
            assortmentId
            assortmentTexts {
              title
            }
          }
        }
      }
    }
  `),
  mapProps(({ data: { product, loading }, ...rest }) => ({
    product,
    loading,
    ...rest,
  })),
  pure
)(ProductHeader);
