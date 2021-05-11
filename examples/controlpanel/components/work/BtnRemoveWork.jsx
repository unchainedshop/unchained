import React from 'react';
import { withRouter } from 'next/router';
import { compose, pure, withHandlers, mapProps } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';

const BtnRemoveWork = ({
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
      mutation removeWork($workId: ID!) {
        removeWork(workId: $workId) {
          _id
          status
          deleted
        }
      }
    `,
    {
      options: {
        refetchQueries: ['workQueue'],
      },
    }
  ),
  withHandlers({
    onClick:
      ({ workId, mutate, router }) =>
      async () => {
      if (confirm('Really?')) { // eslint-disable-line
          await mutate({
            variables: {
              workId,
            },
          });
          router.push('/work');
        }
      },
  }),
  mapProps(({ workId, mutate, ...rest }) => ({
    ...rest,
  })),
  pure
)(BtnRemoveWork);
