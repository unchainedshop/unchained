import { compose, withHandlers } from 'recompose';
import { graphql } from '@apollo/client/react/hoc';
import React from 'react';
import { withRouter } from 'next/router';
import gql from 'graphql-tag';
import { Button } from 'semantic-ui-react';

const AssortmentChangeBaseButton = ({ changeBaseAssortment, assortmentId }) => (
  <Button basic key={assortmentId} name={assortmentId} onClick={changeBaseAssortment}>
    Define as base assortment
  </Button>
);

export default compose(
  withRouter,
  graphql(
    gql`
      mutation changeBaseAssortment($assortmentId: ID!) {
        setBaseAssortment(assortmentId: $assortmentId) {
          _id
          isBase
        }
      }
    `,
    {
      options: {
        refetchQueries: ['assortments'],
      },
    },
  ),
  withHandlers({
    changeBaseAssortment:
      ({ mutate }) =>
      (event, element) =>
        mutate({ variables: { assortmentId: element.name } }),
  }),
)(AssortmentChangeBaseButton);
