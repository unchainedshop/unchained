import { compose, withState, withHandlers } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React from 'react';
import dynamic from 'next/dynamic';

const CytoscapeComponentWithNoSSR = dynamic(
  () => import('./CytoscapeComponent'),
  { ssr: false } // because of a window object
);

const AssortmentList = ({ data }) => (
  <CytoscapeComponentWithNoSSR data={data} />
);

export default compose(
  withState('isShowLeafNodes', 'setShowLeafNodes', false),
  graphql(gql`
    query assortments($limit: Int, $offset: Int, $isShowLeafNodes: Boolean) {
      assortments(
        limit: $limit
        offset: $offset
        includeInactive: true
        includeLeaves: $isShowLeafNodes
      ) {
        _id
        texts {
          _id
          title
        }
        linkedAssortments {
          _id
          parent {
            _id
            texts {
              _id
              title
            }
          }
          child {
            _id
            texts {
              _id
              title
            }
          }
          tags
        }
      }
    }
  `),
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
    }
  ),
  withHandlers({
    changeBaseAssortment: ({ mutate }) => (event, element) =>
      mutate({ variables: { assortmentId: element.name } }),
    toggleShowLeafNodes: ({ isShowLeafNodes, setShowLeafNodes }) => () =>
      setShowLeafNodes(!isShowLeafNodes),
  })
)(AssortmentList);
