import React from 'react';
import { compose, withHandlers } from 'recompose';
import { Item, Button } from 'semantic-ui-react';
import { SortableElement } from 'react-sortable-hoc';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

const AssortmentFilterListItem = ({ filter, tags, removeAssortmentFilter }) => (
  <Item>
    <Item.Content>
      <Item.Header>
        {filter.texts ? filter.texts.title : filter.key}
      </Item.Header>
      <span>{JSON.stringify(tags)}</span>
      <Item.Extra>
        <Button secondary floated="right" onClick={removeAssortmentFilter}>
          Delete
        </Button>
      </Item.Extra>
    </Item.Content>
  </Item>
);

export default compose(
  graphql(
    gql`
      mutation removeAssortmentFilter($assortmentFilterId: ID!) {
        removeAssortmentFilter(assortmentFilterId: $assortmentFilterId) {
          _id
        }
      }
    `,
    {
      name: 'removeAssortmentFilter',
      options: {
        refetchQueries: ['assortmentFilters'],
      },
    }
  ),
  withHandlers({
    removeAssortmentFilter: ({ removeAssortmentFilter, _id }) => async () => {
      await removeAssortmentFilter({
        variables: {
          assortmentFilterId: _id,
        },
      });
    },
  }),
  SortableElement
)(AssortmentFilterListItem);
