import React from 'react';
import Link from 'next/link';
import { compose, withHandlers } from 'recompose';
import { Item, Button, List, Label, Icon } from 'semantic-ui-react';
import { SortableElement } from 'react-sortable-hoc';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

const AssortmentLinkListItem = ({
  parent,
  child,
  tags,
  removeAssortmentLink,
}) => {
  return (
    <Item>
      <Item.Content>
        <Item.Header>
          <List as="ol">
            <List.Item as="li" value="*">
              <Link
                href={`/assortments/edit?_id=${parent._id}&tab=AssortmentLinks`}
              >
                <>
                  <a
                    href={`/assortments/edit?_id=${parent._id}&tab=AssortmentLinks`}
                  >
                    {parent.texts && parent.texts.title}
                  </a>
                  {tags &&
                    tags.map((tag) => {
                      return <Label>{tag}</Label>;
                    })}
                </>
              </Link>
              <List.Item as="ol">
                <List.Item as="li" value="-">
                  <Link
                    href={`/assortments/edit?_id=${child._id}&tab=AssortmentLinks`}
                  >
                    <a
                      href={`/assortments/edit?_id=${child._id}&tab=AssortmentLinks`}
                    >
                      {child.texts && child.texts.title}
                    </a>
                  </Link>
                </List.Item>
              </List.Item>
            </List.Item>
          </List>
        </Item.Header>
        <Item.Extra>
          <Button secondary floated="right" onClick={removeAssortmentLink}>
            Delete
          </Button>
        </Item.Extra>
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
