import React from 'react';
import Link from 'next/link';
import { compose, withHandlers } from 'recompose';
import { Item, Button, Icon, List, Label } from 'semantic-ui-react';
import { SortableElement, SortableHandle } from 'react-sortable-hoc';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';

const DragHandle = SortableHandle(() => (
  <Icon name="arrows alternate vertical" link size="small" />
));

const AssortmentFilterListItem = ({ filter, removeAssortmentFilter, tags }) => (
  <Item>
    <Item.Content>
      <Item.Header>
        <List as="ol">
          <List.Item as="li" value="">
            <DragHandle />
            <Link href={`/filters/edit?_id=${filter._id}`}>
              <a href={`/filters/edit?_id=${filter._id}`}>
                {filter.texts?.title || filter.key}
                &nbsp;
                {tags &&
                  tags.map((tag) => {
                    return <Label>{tag}</Label>;
                  })}
              </a>
            </Link>
          </List.Item>
        </List>
      </Item.Header>
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
    removeAssortmentFilter:
      ({ removeAssortmentFilter, _id }) =>
      async () => {
        await removeAssortmentFilter({
          variables: {
            assortmentFilterId: _id,
          },
        });
      },
  }),
  SortableElement
)(AssortmentFilterListItem);
