import React from 'react';
import Link from 'next/link';
import { compose, withHandlers } from 'recompose';
import { Item, Button } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { SortableElement } from 'react-sortable-hoc';
import { useRouter } from 'next/router';
import TagList from '../tagList';

const AssortmentLinkListItem = ({
  parent,
  child,
  tags,
  removeAssortmentLink,
}) => {
  const router = useRouter();
  const displayAssortment = (id) => {
    router.push(`/assortments/edit?_id=${id}&tab=AssortmentLinks`);
  };
  return (
    <Item>
      <Item.Content>
        <button type="button" onClick={() => displayAssortment(parent._id)}>
          {parent.texts && parent.texts.title}
        </button>
        &nbsp;/&nbsp;
        <button type="button" onClick={() => displayAssortment(child._id)}>
          {child.texts && child.texts.title}
        </button>
        <TagList tags={tags} />
        <Button secondary floated="right" onClick={removeAssortmentLink}>
          Delete
        </Button>
      </Item.Content>
    </Item>
  );
};

export default compose(
  graphql(
    gql`
      mutation removeAssortmentLink($assortmentLinkId: ID!) {
        removeAssortmentLink(assortmentLinkId: $assortmentLinkId) {
          _id
        }
      }
    `,
    {
      name: 'removeAssortmentLink',
      options: {
        refetchQueries: ['assortmentLinks'],
      },
    }
  ),
  withHandlers({
    removeAssortmentLink: ({ removeAssortmentLink, _id }) => async () => {
      await removeAssortmentLink({
        variables: {
          assortmentLinkId: _id,
        },
      });
    },
  }),
  SortableElement
)(AssortmentLinkListItem);
