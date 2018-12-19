import React from 'react';
import Link from 'next/link';
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
        <Link href={`/assortments/edit?_id=${parent._id}&tab=AssortmentLinks`}>
          <a href={`/assortments/edit?_id=${parent._id}&tab=AssortmentLinks`}>
            {parent.texts && parent.texts.title}
          </a>
        </Link>
        &nbsp;/&nbsp;
        <Link href={`/assortments/edit?_id=${child._id}&tab=AssortmentLinks`}>
          <a href={`/assortments/edit?_id=${child._id}&tab=AssortmentLinks`}>
            {child.texts && child.texts.title}
          </a>
        </Link>
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
)(AssortmentLinkListItem);
