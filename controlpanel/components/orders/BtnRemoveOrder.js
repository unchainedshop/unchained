import React from 'react';
import { withRouter } from 'next/router';
import { compose, pure, withHandlers, mapProps } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

const BtnRemoveOrder = ({
  onClick, Component = 'button', children, ...rest
}) => (
  <Component onClick={onClick} {...rest}>{children}</Component>
);

export default compose(
  withRouter,
  graphql(gql`
    mutation removeOrder($orderId: ID!) {
      removeOrder(orderId: $orderId) {
        _id
        status
        updated
      }
    }
  `, {
    options: {
      refetchQueries: [
        'orders',
      ],
    },
  }),
  withHandlers({
    onClick: ({ orderId, mutate, router }) => async () => {
      if (confirm('Really?')) { // eslint-disable-line
        await mutate({
          variables: {
            orderId,
          },
        });
        router.push('/orders');
      }
    },
  }),
  mapProps(({ orderId, mutate, ...rest }) => ({
    ...rest,
  })),
  pure,
)(BtnRemoveOrder);
