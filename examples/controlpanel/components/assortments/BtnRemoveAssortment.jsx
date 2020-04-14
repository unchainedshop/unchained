import React from 'react';
import { withRouter } from 'next/router';
import { compose, pure, withHandlers, mapProps } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

const BtnRemoveAssortment = ({
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
      mutation removeAssortment($assortmentId: ID!) {
        removeAssortment(assortmentId: $assortmentId) {
          _id
          updated
        }
      }
    `,
    {
      options: {
        refetchQueries: ['assortments'],
      },
    }
  ),
  withHandlers({
    onClick: ({ assortmentId, mutate, router }) => async () => {
      // eslint-disable-next-line
      if (confirm('Really?')) {
        await mutate({
          variables: {
            assortmentId,
          },
        });
        router.push('/assortments');
      }
    },
  }),
  mapProps(({ assortmentId, mutate, ...rest }) => ({
    ...rest,
  })),
  pure
)(BtnRemoveAssortment);
