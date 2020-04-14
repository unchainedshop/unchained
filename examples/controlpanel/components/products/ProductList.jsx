import { compose, pure, withState } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React from 'react';
import { Table, Icon, Button, Loader, Label } from 'semantic-ui-react';
import InfiniteScroll from 'react-infinite-scroller';
import Link from 'next/link';

const ProductList = ({ products, loadMoreEntries, hasMore }) => (
  <Table celled>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell colSpan="3">
          <Link href="/products/new">
            <Button
              floated="right"
              icon
              labelPosition="left"
              primary
              size="small"
              href="/products/new"
            >
              <Icon name="plus" />
              Add
            </Button>
          </Link>
        </Table.HeaderCell>
      </Table.Row>
      <Table.Row>
        <Table.HeaderCell>Name</Table.HeaderCell>
        <Table.HeaderCell>Active</Table.HeaderCell>
        <Table.HeaderCell>Tags</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
    {products && (
      <InfiniteScroll
        element={'tbody'}
        loadMore={loadMoreEntries}
        hasMore={hasMore}
        loader={
          <Table.Row key="product-loader">
            <Table.Cell colSpan="4">
              <Loader active inline="centered" />
            </Table.Cell>
          </Table.Row>
        }
      >
        {products.map((product) => (
          <Table.Row key={product._id}>
            <Table.Cell>
              <Link href={`/products/edit?_id=${product._id}`}>
                <a href={`/products/edit?_id=${product._id}`}>
                  {product.texts.title}
                </a>
              </Link>
            </Table.Cell>
            <Table.Cell>
              {product.status === 'ACTIVE' && (
                <Icon color="green" name="checkmark" size="large" />
              )}
            </Table.Cell>
            <Table.Cell>
              {product.tags &&
                product.tags.length > 0 &&
                product.tags.map((tag) => (
                  <Label key={tag} color="grey" horizontal>
                    {tag}
                  </Label>
                ))}
            </Table.Cell>
          </Table.Row>
        ))}
      </InfiniteScroll>
    )}
    <Table.Footer fullWidth>
      <Table.Row>
        <Table.HeaderCell colSpan="3">
          <Link href="/products/new">
            <Button
              floated="right"
              icon
              labelPosition="left"
              primary
              size="small"
              href="/products/new"
            >
              <Icon name="plus" />
              Add
            </Button>
          </Link>
        </Table.HeaderCell>
      </Table.Row>
    </Table.Footer>
  </Table>
);

const ITEMS_PER_PAGE = 10;
export const PRODUCT_LIST_QUERY = gql`
  query getAllProducts($offset: Int, $limit: Int) {
    products(offset: $offset, limit: $limit, includeDrafts: true) {
      _id
      tags
      status
      texts {
        _id
        slug
        title
      }
    }
  }
`;

export default compose(
  withState('hasMore', 'updateHasMore', true),
  graphql(PRODUCT_LIST_QUERY, {
    options: () => ({
      variables: {
        offset: 0,
        limit: ITEMS_PER_PAGE,
      },
    }),
    props: ({
      data: { loading, products, fetchMore },
      ownProps: { updateHasMore },
    }) => ({
      loading,
      products,
      loadMoreEntries: () =>
        fetchMore({
          variables: {
            offset: products.length,
            limit: ITEMS_PER_PAGE,
          },
          updateQuery: (previousResult, { fetchMoreResult }) => {
            if (!fetchMoreResult || fetchMoreResult.products.length === 0) {
              updateHasMore(false);
              return previousResult;
            }
            const idComparator = fetchMoreResult.products[0]._id;
            const alreadyAdded = previousResult.products.reduce(
              (oldValue, item) => (item._id === idComparator ? true : oldValue),
              false
            );
            if (alreadyAdded) {
              updateHasMore(false);
              return previousResult;
            }
            return {
              ...previousResult,
              products: [
                ...previousResult.products,
                ...fetchMoreResult.products,
              ],
            };
          },
        }),
    }),
  }),
  pure
)(ProductList);
