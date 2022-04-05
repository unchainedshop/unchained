import React from 'react';
import { withRouter } from 'next/router';
import { compose, pure, withHandlers, mapProps } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';

const BtnRemoveQuotation = ({ onClick, Component = 'button', children, ...rest }) => (
  <Component onClick={onClick} {...rest}>
    {children}
  </Component>
);

export default compose(
  withRouter,
  graphql(
    gql`
      mutation removeQuotation($quotationId: ID!) {
        removeQuotation(quotationId: $quotationId) {
          _id
          status
          updated
        }
      }
    `,
    {
      options: {
        refetchQueries: ['quotations'],
      },
    },
  ),
  withHandlers({
    onClick:
      ({ quotationId, mutate, router }) =>
      async () => {
      if (confirm('Really?')) { // eslint-disable-line
          await mutate({
            variables: {
              quotationId,
            },
          });
          router.push('/quotations');
        }
      },
  }),
  mapProps(({ quotationId, mutate, ...rest }) => ({
    ...rest,
  })),
  pure,
)(BtnRemoveQuotation);
