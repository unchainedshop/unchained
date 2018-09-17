import React from 'react';
import { withRouter } from 'next/router';
import {
  compose, pure, withHandlers, mapProps,
} from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

const BtnRemoveFilter = ({
  onClick, Component = 'button', children, ...rest
}) => (
  <Component onClick={onClick} {...rest}>
    {children}
  </Component>
);

export default compose(
  withRouter,
  graphql(gql`
    mutation removeFilter($filterId: ID!) {
      removeFilter(filterId: $filterId) {
        _id
        updated
      }
    }
  `, {
    options: {
      refetchQueries: [
        'filters',
      ],
    },
  }),
  withHandlers({
    onClick: ({ filterId, mutate, router }) => async () => {
      if (confirm('Really?')) { // eslint-disable-line
        await mutate({
          variables: {
            filterId,
          },
        });
        router.push('/filters');
      }
    },
  }),
  mapProps(({ filterId, mutate, ...rest }) => ({
    ...rest,
  })),
  pure,
)(BtnRemoveFilter);
