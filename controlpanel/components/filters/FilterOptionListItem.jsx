import React from 'react';
import { compose, withState, withHandlers } from 'recompose';
import { List, Button } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import FormEditFilterTexts from './FormEditFilterTexts';

const FilterOptionItem = ({
  filterId,
  texts,
  value,
  isEditing,
  toggleEditing,
  removeFilterOption
}) => (
  <List.Item>
    <List.Content floated="right">
      {!isEditing && <Button onClick={toggleEditing}>Edit</Button>}
      {!isEditing && (
        <Button secondary onClick={removeFilterOption}>
          Delete
        </Button>
      )}
    </List.Content>
    <List.Content>
      <List.Header>{value}</List.Header>
      <List.Description>{texts && `${texts.title}`}</List.Description>
      {isEditing ? (
        <FormEditFilterTexts
          filterId={filterId}
          filterOptionValue={value}
          onCancel={toggleEditing}
          onSubmitSuccess={toggleEditing}
        />
      ) : (
        ''
      )}
    </List.Content>
  </List.Item>
);

export default compose(
  graphql(
    gql`
      mutation removeFilterOption($filterId: ID!, $filterOptionValue: String!) {
        removeFilterOption(
          filterId: $filterId
          filterOptionValue: $filterOptionValue
        ) {
          _id
        }
      }
    `,
    {
      name: 'removeFilterOption',
      options: {
        refetchQueries: ['filterOptions']
      }
    }
  ),
  withState('isEditing', 'setIsEditing', false),
  withHandlers({
    removeFilterOption: ({
      removeFilterOption,
      value,
      filterId
    }) => async () => {
      await removeFilterOption({
        variables: {
          filterId,
          filterOptionValue: value
        }
      });
    },
    toggleEditing: ({ isEditing, setIsEditing }) => event => {
      if (event && event.preventDefault) event.preventDefault();
      setIsEditing(!isEditing);
    }
  })
)(FilterOptionItem);
