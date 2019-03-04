import React from 'react';
import { withRouter } from 'next/router';
import { compose, pure, withHandlers, mapProps } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

const BtnRemoveProduct = ({
  onClick,
  Component = 'button',
  children,
  ...rest
}) => (
  <Component onClick={onClick} {...rest}>
    {children}
  </Component>
);

export default compose(
  withRouter,
  graphql(
    gql`
      mutation removeProduct($productId: ID!) {
        removeProduct(productId: $productId) {
          _id
          status
          updated
        }
      }
    `,
    {
      options: {
        refetchQueries: ['getAllProducts']
      }
    }
  ),
  withHandlers({
    onClick: ({ productId, mutate, router }) => async () => {
      if (confirm('Really?')) { // eslint-disable-line
        await mutate({
          variables: {
            productId
          }
        });
        router.push('/products');
      }
    }
  }),
  mapProps(({ productId, mutate, ...rest }) => ({
    ...rest
  })),
  pure
)(BtnRemoveProduct);
