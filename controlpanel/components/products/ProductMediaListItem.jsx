import React from 'react';
import { compose, withState, withHandlers } from 'recompose';
import {
  Item, Label, Button, Header,
} from 'semantic-ui-react';
import { SortableElement } from 'react-sortable-hoc';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import FormEditProductMediaTexts from './FormEditProductMediaTexts';

const ProductMediaListItem = ({
  _id, tags, file, texts, isEditing, toggleEditing, isEditingDisabled, removeMedia,
}) => (
  <Item>
    <Item.Image size="tiny" src={file.url} />
    <Item.Content>
      <Item.Header as="a" href={file.url} target="_blank">
        {file.name}
      </Item.Header>
      <Item.Meta>
        <span className="cinema">
          {file.size / 1000}
kb
          {' '}
          {file.type}
        </span>
      </Item.Meta>
      <Item.Description>
        {isEditing ? (
          <FormEditProductMediaTexts
            productMediaId={_id}
            isEditingDisabled={isEditingDisabled}
            onCancel={toggleEditing}
            onSubmitSuccess={toggleEditing}
          />
        ) : (
          <div>
            <Header as="h3">
              {texts && texts.title}
            </Header>
            <p>
              {texts && texts.subtitle}
            </p>
          </div>
        )}
      </Item.Description>
      <Item.Extra>
        {tags && tags.map(tag => (
          <Label key={`tag-${tag}`}>
            {tag}
          </Label>
        ))}
        {!isEditing && !isEditingDisabled && (
          <Button
            floated="right"
            onClick={toggleEditing}
          >
              Edit
          </Button>
        )}
        {!isEditing && !isEditingDisabled && (
          <Button
            secondary
            floated="right"
            onClick={removeMedia}
          >
              Delete
          </Button>
        )}
      </Item.Extra>
    </Item.Content>
  </Item>
);

export default compose(
  graphql(gql`
    mutation removeProductMedia($productMediaId: ID!) {
      removeProductMedia(productMediaId: $productMediaId) {
        _id
      }
    }
  `, {
    name: 'removeProductMedia',
    options: {
      refetchQueries: [
        'productMedia',
      ],
    },
  }),
  withState('isEditing', 'setIsEditing', false),
  withHandlers({
    removeMedia: ({ removeProductMedia, _id }) => async () => {
      await removeProductMedia({
        variables: {
          productMediaId: _id,
        },
      });
    },
    toggleEditing: ({ isEditing, setIsEditing }) => (event) => {
      if (event && event.preventDefault) event.preventDefault();
      setIsEditing(!isEditing);
    },
  }),
  SortableElement,
)(ProductMediaListItem);
