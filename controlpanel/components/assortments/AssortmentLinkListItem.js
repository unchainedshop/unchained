import React from 'react';
import { compose, withHandlers } from 'recompose';
import { Item, Button } from 'semantic-ui-react';
import { SortableElement } from 'react-sortable-hoc';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

const AssortmentLinkListItem = ({
  parent, child, removeAssortmentLink,
}) => (
  <Item>
    <Item.Content>
      <Item.Header>
        {parent.texts.title}
/
        {child.texts.title}
      </Item.Header>
      <Item.Extra>
        <Button
          secondary
          floated="right"
          onClick={removeAssortmentLink}
        >
            Delete
        </Button>
      </Item.Extra>
    </Item.Content>
  </Item>
);

export default compose(
  graphql(gql`
    mutation removeAssortmentLink($assortmentLinkId: ID!) {
      removeAssortmentLink(assortmentLinkId: $assortmentLinkId) {
        _id
      }
    }
  `, {
    name: 'removeAssortmentLink',
    options: {
      refetchQueries: [
        'assortmentLinks',
      ],
    },
  }),
  withHandlers({
    removeAssortmentLink: ({ removeAssortmentLink, _id }) => async () => {
      await removeAssortmentLink({
        variables: {
          assortmentLinkId: _id,
        },
      });
    },
  }),
  SortableElement,
)(AssortmentLinkListItem);
