import React from 'react';
import { compose, pure, mapProps } from 'recompose';
import Moment from 'react-moment';
import { Menu, Dropdown, Segment, Label, List, Grid } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import BtnPublishProduct from './BtnPublishProduct';
import BtnRemoveProduct from './BtnRemoveProduct';
import BtnUnpublishProduct from './BtnUnpublishProduct';
import FormEditProduct from './FormEditProduct';

const ProductHeader = ({ loading, productId, product = {} }) => [
  <Menu fluid attached="top" borderless key="header-title">
    <Menu.Item header>Product: {product.texts && product.texts.title}</Menu.Item>
    <Menu.Item><Label color="red" horizontal>{product.status}</Label></Menu.Item>
    <Menu.Menu position="right">
      <Dropdown item icon="wrench" simple>
        <Dropdown.Menu>
          <Dropdown.Header>Optionen</Dropdown.Header>
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
              <List.Content>
                  Produktart: {product.__typename // eslint-disable-line
                  }
              </List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="add to calendar" />
              <List.Content>
                  Erstellt: {product.created ? (<Moment format="LLL">{product.created}</Moment>) : 'Unbekannt'}
              </List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="refresh" />
              <List.Content>
                  Aktualisiert: {product.updated ? (<Moment format="LLL">{product.updated}</Moment>) : 'Unbekannt'}
              </List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="eye" />
              <List.Content>
                  Veröffentlicht: {product.published ? (<Moment format="LLL">{product.published}</Moment>) : 'Unbekannt'}
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
        status,
        created,
        updated,
        published,
        tags,
        ... on ProductTranslation {
          texts {
            _id
            title
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
  pure,
)(ProductHeader);
